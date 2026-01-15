const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/vendor/alpine.js', express.static(path.join(__dirname, 'node_modules/alpinejs/dist/cdn.min.js')));

let cartData = {
  "shops": [
    {
      "id": 592000005565,
      "name": "TestShop",
      "avatar": "test_shop_img.jpg",
      "link": "/shop/testshop",
      "cart_items": [
        {
          "item": {
            "object_id": "36e402497", "id": 5233035, "name": "Teszt product", "price": "5000",
            "unit": "db", "qty": 2, "min_qty": 1, "max_qty": 15, "pack_quantity": 1,
            "to_order_product": 1, "to_order_product_time": 10,
            "accessories": {
              "items": [{ "id": 1, "name": "Test product accessories", "qty": 5, "price": "500" }]
            }
          }
        },
        {
          "item": {
            "object_id": "387104ab", "id": 5496656, "name": "Second test product", "price": "5000",
            "unit": "db", "qty": 2, "min_qty": 1, "max_qty": 34, "pack_quantity": 1,
            "to_order_product": 0, "to_order_product_time": 0,
            "accessories": { "items": null }
          }
        }
      ],
      "subtotal": { "subtotal": "0", "shipping_price": "1490", "discount": "0", "total": "0" }
    }
  ],
  "discounts": {
    "giftcards": [{ "id": 2419, "code": "A0WOA9RDFEI2F2", "value": 5000 }]
  },
  "currency": "HUF",
  "grandtotal": { "product_qty": 0, "shop_qty": 1, "grandtotal": "0", "shipping_price": "1490", "payment_price": "290", "discount": "0" }
};

function recalculateCart() {
  let grandProductQty = 0;
  let grandTotalVal = 0;
  let totalDiscount = 0;

  totalDiscount = cartData.discounts.giftcards.reduce((acc, card) => acc + card.value, 0);

  cartData.shops.forEach(shop => {
    let shopSubtotal = 0;

    shop.cart_items.forEach(line => {
      const qty = line.item.qty;
      const price = parseInt(line.item.price);

      // Item price
      shopSubtotal += (qty * price);
      grandProductQty += qty;

      // Accessory prices (simplified logic: acc qty * acc price)
      if (line.item.accessories && line.item.accessories.items) {
        line.item.accessories.items.forEach(acc => {
          shopSubtotal += (parseInt(acc.qty) * parseInt(acc.price));
        });
      }
    });

    // Update Shop Subtotal
    shop.subtotal.subtotal = shopSubtotal.toString();
    const shipping = parseInt(shop.subtotal.shipping_price) || 0;
    shop.subtotal.total = (shopSubtotal + shipping).toString();

    grandTotalVal += (shopSubtotal + shipping);
  });

  // Update Grand Total
  // + Payment price (hardcoded in example as 290)
  const paymentPrice = parseInt(cartData.grandtotal.payment_price) || 0;
  grandTotalVal += paymentPrice;

  cartData.grandtotal.product_qty = grandProductQty;
  cartData.grandtotal.discount = totalDiscount.toString();
  cartData.grandtotal.grandtotal = Math.max(0, grandTotalVal - totalDiscount).toString();
}

// Initial calculation
recalculateCart();

// --- API ROUTES ---

// GET /api/cart
app.get('/api/cart', (req, res) => {
  // Simulate network delay
  setTimeout(() => {
    res.json(cartData);
  }, 500);
});

// PATCH /api/cart/item
app.patch('/api/cart/item', (req, res) => {
  const { object_id, qty } = req.body;

  // Validate input
  if (!object_id || qty === undefined) {
    return res.status(400).json({ error: "Missing object_id or qty" });
  }

  let itemFound = false;

  // Find and update item
  cartData.shops.forEach(shop => {
    const index = shop.cart_items.findIndex(i => i.item.object_id === object_id);
    if (index !== -1) {
      itemFound = true;
      if (qty <= 0) {
        // Remove item
        shop.cart_items.splice(index, 1);
      } else {
        // Update qty
        shop.cart_items[index].item.qty = qty;
      }
    }
  });

  if (!itemFound) {
    return res.status(404).json({ error: "Item not found" });
  }

  // Recalculate totals on server
  recalculateCart();

  // Simulate network delay and return the FRESH cart
  setTimeout(() => {
    res.json(cartData);
  }, 600);
});

app.listen(port, () => {
  console.log(`Minicart app running at http://localhost:${port}`);
});