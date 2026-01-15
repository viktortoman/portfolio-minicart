import express from 'express';
const app = express();
const port = 3000;

app.use(express.json());

let cartData = {
  "shops": [
    {
      "id": 592000005565, "name": "TestShop", "avatar": "test_shop_img.jpg", "link": "/shop/testshop",
      "cart_items": [
        {
          "item": {
            "object_id": "36e402497", "id": 5233035, "name": "Teszt product", "price": "5000",
            "unit": "db", "qty": 2, "min_qty": 1, "max_qty": 15, "pack_quantity": 1,
            "to_order_product": 1, "to_order_product_time": 10,
            "accessories": { "items": [{ "id": 1, "name": "Kiegészítő elem", "qty": 5, "price": "500" }] }
          }
        },
        {
          "item": {
            "object_id": "387104ab", "id": 5496656, "name": "Második termék", "price": "5000",
            "unit": "db", "qty": 2, "min_qty": 1, "max_qty": 34, "pack_quantity": 1,
            "to_order_product": 0, "to_order_product_time": 0,
            "accessories": { "items": null }
          }
        }
      ],
      "subtotal": { "subtotal": "0", "shipping_price": "1490", "discount": "0", "total": "0" }
    }
  ],
  "discounts": { "giftcards": [{ "id": 2419, "code": "GIFT-2024", "value": 5000 }] },
  "currency": "HUF",
  "grandtotal": { "product_qty": 0, "shop_qty": 1, "grandtotal": "0", "shipping_price": "1490", "payment_price": "290", "discount": "0" }
};

function recalculateCart() {
  let grandProductQty = 0;
  let grandTotalVal = 0;
  const totalDiscount = cartData.discounts.giftcards.reduce((acc, card) => acc + card.value, 0);

  cartData.shops.forEach(shop => {
    let shopSubtotal = 0;
    shop.cart_items.forEach(line => {
      shopSubtotal += (line.item.qty * parseInt(line.item.price));
      if (line.item.accessories?.items) {
        line.item.accessories.items.forEach(acc => {
          shopSubtotal += (parseInt(acc.qty) * parseInt(acc.price));
        });
      }
      grandProductQty += line.item.qty;
    });

    shop.subtotal.subtotal = shopSubtotal.toString();
    const shipping = parseInt(shop.subtotal.shipping_price) || 0;
    shop.subtotal.total = (shopSubtotal + shipping).toString();
    grandTotalVal += (shopSubtotal + shipping);
  });

  const paymentPrice = parseInt(cartData.grandtotal.payment_price) || 0;
  grandTotalVal += paymentPrice;

  cartData.grandtotal.product_qty = grandProductQty;
  cartData.grandtotal.discount = totalDiscount.toString();
  cartData.grandtotal.grandtotal = Math.max(0, grandTotalVal - totalDiscount).toString();
}

recalculateCart();

app.get('/api/cart', (req, res) => {
  setTimeout(() => res.json(cartData), 500);
});

app.patch('/api/cart/item', (req, res) => {
  const { object_id, qty } = req.body;
  let found = false;

  cartData.shops.forEach(shop => {
    const idx = shop.cart_items.findIndex(i => i.item.object_id === object_id);
    if (idx !== -1) {
      found = true;
      if (qty <= 0) shop.cart_items.splice(idx, 1);
      else shop.cart_items[idx].item.qty = qty;
    }
  });

  if (!found) return res.status(404).json({ error: "Item not found" });

  recalculateCart();
  setTimeout(() => res.json(cartData), 500);
});

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});