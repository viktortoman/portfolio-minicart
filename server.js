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
        "method_name": "GLS Courier"
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
            "price": "12000",
            "unit": "pack",
            "qty": 1, // Actually 3 t-shirts because pack=3
            "min_qty": 1,
            "max_qty": 20,
            "pack_quantity": 3, // Sold in packs
            "to_order_product": 0,
            "accessories": null
          }
        }
      ],
      "shipping": {
        "price": "1490",
        "method_name": "Foxpost Locker"
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

  // 1. Calculation per Shop
  cartData.shops.forEach(shop => {
    let shopItemsTotal = 0;

    // Sum product prices
    shop.cart_items.forEach(line => {
      // Main product price
      shopItemsTotal += (line.item.qty * parseInt(line.item.price));
      grandProductQty += line.item.qty;

      // Accessory prices (if any)
      if (line.item.accessories?.items) {
        line.item.accessories.items.forEach(acc => {
          // Assuming accessory qty is linked to main product or fixed
          // Simplified logic: acc.qty * acc.price
          shopItemsTotal += (parseInt(acc.qty) * parseInt(acc.price));
        });
      }
    });

    // Populate Shop Subtotal
    const shippingPrice = parseInt(shop.shipping.price) || 0;
    shop.subtotal.subtotal = shopItemsTotal.toString();
    shop.subtotal.shipping_price = shippingPrice.toString();
    shop.subtotal.total = (shopItemsTotal + shippingPrice).toString();

    // Accumulate Grand Total
    grandTotalVal += (shopItemsTotal + shippingPrice);
    grandShipping += shippingPrice;
  });

  // 2. Global costs and discounts
  const paymentPrice = parseInt(cartData.grandtotal.payment_price) || 0;
  const giftCardValue = cartData.discounts.giftcards.reduce((sum, card) => sum + card.value, 0);

  // Add transaction fee to total
  grandTotalVal += paymentPrice;

  // Save final figures
  cartData.grandtotal.shop_qty = cartData.shops.length;
  cartData.grandtotal.product_qty = grandProductQty;
  cartData.grandtotal.shipping_price = grandShipping.toString();
  cartData.grandtotal.discount = giftCardValue.toString();

  // Grand total cannot be negative
  cartData.grandtotal.grandtotal = Math.max(0, grandTotalVal - giftCardValue).toString();
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

  // Find product in any shop
  for (const shop of cartData.shops) {
    const itemIndex = shop.cart_items.findIndex(i => i.item.object_id === object_id);

    if (itemIndex > -1) {
      itemFound = true;
      if (qty <= 0) {
        // Remove item
        shop.cart_items.splice(itemIndex, 1);
      } else {
        // Update quantity
        shop.cart_items[itemIndex].item.qty = qty;
      }
      break; // Stop searching if found
    }
  }

  if (!itemFound) {
    return res.status(404).json({ error: "Product not found." });
  }

  // Recalculate everything
  recalculateCart();

  // Return fresh state
  setTimeout(() => {
    res.json(cartData);
  }, 500);
});

app.listen(port, () => {
  console.log(`Minicart Server running at http://localhost:${port}`);
});