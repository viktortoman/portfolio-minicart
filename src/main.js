import './style.css';
import Alpine from 'alpinejs';

// Make Alpine global for development
window.Alpine = Alpine;

Alpine.data('minicart', () => ({
  cart: null,
  isLoading: false,
  error: null,
  // Set to store IDs of items currently updating (Race condition protection)
  updatingItems: new Set(),

  init() {
    this.fetchCart();
  },

  async fetchCart() {
    this.isLoading = true;
    this.error = null;
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error("Network error");
      this.cart = await res.json();
    } catch (e) {
      console.error(e);
      this.error = "Failed to load cart data.";
    } finally {
      this.isLoading = false;
    }
  },

  // Update Quantity (With Validation)
  async updateQty(item, direction) {
    // 1. Race condition protection: If currently saving, ignore clicks
    if (this.isItemUpdating(item.object_id)) return;

    // 2. Handle pack quantity steps
    const packStep = parseInt(item.pack_quantity) || 1;
    const currentQty = parseInt(item.qty);
    const newQty = currentQty + (direction * packStep);

    // 3. Min/Max validation
    const min = parseInt(item.min_qty) || 1;
    const max = parseInt(item.max_qty) || 999;

    if (newQty < min || newQty > max) return;

    // 4. Sync with server
    await this.syncItem(item.object_id, newQty);
  },

  // Remove function
  async removeItem(item) {
    if (this.isItemUpdating(item.object_id)) return;
    if (!confirm(`Are you sure you want to remove "${item.name}"?`)) return;

    await this.syncItem(item.object_id, 0); // 0 qty = delete
  },

  // Shared API call (PATCH)
  async syncItem(objectId, newQty) {
    // Set loading state for specific item
    this.updatingItems.add(objectId);
    this.updatingItems = new Set(this.updatingItems); // Reactivity trigger

    try {
      const res = await fetch('/api/cart/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_id: objectId, qty: newQty })
      });

      if (!res.ok) throw new Error("Update failed");

      // Server returns full fresh cart (with recalculated prices)
      this.cart = await res.json();
    } catch (e) {
      alert('Error saving changes. Please try again.');
    } finally {
      // Remove loading state
      this.updatingItems.delete(objectId);
      this.updatingItems = new Set(this.updatingItems);
    }
  },

  // Helper: Is this item loading?
  isItemUpdating(id) {
    return this.updatingItems.has(id);
  },

  // Helper: Money formatting (HUF + Thousand separator)
  formatMoney(amount) {
    if (!this.cart || amount === undefined || amount === null) return '...';

    const num = parseFloat(amount);
    if (isNaN(num)) return amount;

    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: this.cart.currency || 'HUF',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(num);
  }
}));

Alpine.start();