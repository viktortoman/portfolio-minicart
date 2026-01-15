import express from 'express';
const app = express();
const port = 3000;

app.use(express.json());

// --- DETAILED MOCK DATABASE (Marketplace structure) ---
let cartData = {
  "shops": [
    {
      "id": 101,
      "name": "TechShop Hungary",
      "link": "/shop/techshop",
      "avatar": "T",
      "cart_items": [
        {
          "item": {
            "object_id": "obj_1",
            "id": 501,
            "name": "Gamer Laptop X1",
            "price": "450000",
            "unit": "db",
            "qty": 1,
            "min_qty": 1,
            "max_qty": 5,
            "pack_quantity": 1,
            "to_order_product": 1,
            "to_order_product_time": 5,
            "image": "",
            "url": "gamer-laptop",
            "accessories": {
              "items": [
                { "id": 901, "name": "Extended Warranty (+1 year)", "qty": 1, "price": "25000" }
              ]
            }
          }
        },
        {
          "item": {
            "object_id": "obj_2",
            "id": 502,
            "name": "Wireless Mouse",
            "price": "15000",
            "unit": "db",
            "qty": 2,
            "min_qty": 1,
            "max_qty": 10,
            "pack_quantity": 1,
            "to_order_product": 0,
            "to_order_product_time": 0,
            "accessories": { "items": null }
          }
        }
      ],
      "shipping": {
        "price": "1990",
        "method_name": "GLS"
      },
      "subtotal": { "subtotal": "0", "shipping_price": "0", "discount": "0", "total": "0" }
    },
    {
      "id": 102,
      "name": "FashionBoutique",
      "link": "/shop/fashion",
      "avatar": "F",
      "cart_items": [
        {
          "item": {
            "object_id": "obj_3",
            "id": 601,
            "name": "Summer T-Shirt Set (3pcs)",
            "price": "4000",
            "unit": "pack",
            "qty": 3, // Actually 3 t-shirts because pack=3
            "min_qty": 3,
            "max_qty": 30,
            "pack_quantity": 3,
            "to_order_product": 0,
            "accessories": null
          }
        }
      ],
      "shipping": {
        "price": "1490",
        "method_name": "Foxpost"
      },
      "subtotal": { "subtotal": "0", "shipping_price": "0", "discount": "0", "total": "0" }
    }
  ],
  "discounts": {
    "giftcards": [
      { "id": 999, "code": "GIFT-5000", "value": 5000, "status": "active" }
    ]
  },
  "currency": "HUF",
  "currency_symbol": "Ft",
  "grandtotal": {
    "product_qty": 0,
    "shop_qty": 0,
    "grandtotal": "0",
    "shipping_price": "0",
    "payment_price": "290", // Credit card transaction fee
    "discount": "0"
  }
};

// --- LOGIC: Cart Recalculation (Server-side simulation) ---
function recalculateCart() {
  let grandTotalVal = 0;
  let grandProductQty = 0;
  let grandShipping = 0;

  cartData.shops.forEach(shop => {
    let shopItemsTotal = 0;

    shop.cart_items.forEach(line => {
      shopItemsTotal += (line.item.qty * parseInt(line.item.price));
      grandProductQty += line.item.qty;

      if (line.item.accessories?.items) {
        line.item.accessories.items.forEach(acc => {
          shopItemsTotal += (parseInt(acc.qty) * parseInt(acc.price));
        });
      }
    });

    const shippingPrice = parseInt(shop.shipping.price) || 0;
    shop.subtotal.subtotal = shopItemsTotal.toString();
    shop.subtotal.shipping_price = shippingPrice.toString();
    shop.subtotal.total = (shopItemsTotal + shippingPrice).toString();

    grandTotalVal += (shopItemsTotal + shippingPrice);
    grandShipping += shippingPrice;
  });

  const paymentPrice = parseInt(cartData.grandtotal.payment_price) || 0;
  const appliedPaymentPrice = grandProductQty > 0 ? paymentPrice : 0;
  const giftCardValue = cartData.discounts.giftcards.reduce((sum, card) => sum + card.value, 0);

  grandTotalVal += appliedPaymentPrice;

  cartData.grandtotal.shop_qty = cartData.shops.length;
  cartData.grandtotal.product_qty = grandProductQty;
  cartData.grandtotal.shipping_price = grandShipping.toString();
  cartData.grandtotal.payment_price = appliedPaymentPrice.toString();
  cartData.grandtotal.discount = giftCardValue.toString();

  const finalTotal = grandProductQty > 0 ? Math.max(0, grandTotalVal - giftCardValue) : 0;
  cartData.grandtotal.grandtotal = finalTotal.toString();
}

// Run once on initialization
recalculateCart();

// --- API ENDPOINTS ---

app.get('/api/cart', (req, res) => {
  // Simulate network latency
  setTimeout(() => {
    res.json(cartData);
  }, 600);
});

app.patch('/api/cart/item', (req, res) => {
  const { object_id, qty } = req.body;
  let itemFound = false;

  for (let sIndex = 0; sIndex < cartData.shops.length; sIndex++) {
    const shop = cartData.shops[sIndex];
    const itemIndex = shop.cart_items.findIndex(i => i.item.object_id === object_id);

    if (itemIndex > -1) {
      itemFound = true;
      if (qty <= 0) {
        shop.cart_items.splice(itemIndex, 1);

        if (shop.cart_items.length === 0) {
          cartData.shops.splice(sIndex, 1);
        }
      } else {
        shop.cart_items[itemIndex].item.qty = qty;
      }

      break;
    }
  }

  if (!itemFound) {
    return res.status(404).json({ error: "Product not found." });
  }

  recalculateCart();

  setTimeout(() => res.json(cartData), 500);
});

app.listen(port, () => {
  console.log(`Minicart Server running at http://localhost:${port}`);
});