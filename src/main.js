import './style.css';
import Alpine from 'alpinejs';

// Make Alpine global for development
window.Alpine = Alpine;

Alpine.data('minicart', () => ({
  cart: null,
  isLoading: false,
  error: null,
  updatingItems: new Set(),

  init() {
    this.fetchCart();
  },

  async fetchCart() {
    this.isLoading = true;
    this.error = null;
    try {
      const res = await fetch('/api/cart');

      // --- DETAILED ERROR HANDLING (UX requirement) ---
      if (!res.ok) {
        // 5xx Server Errors
        if (res.status >= 500) {
          throw new Error("Szerverhiba történt. Kérjük próbálja később! (500)");
        }
        // 4xx Client Errors (e.g. 404 Not Found)
        if (res.status === 404) {
          throw new Error("A kosár nem található. (404)");
        }
        // Other 4xx
        throw new Error(`Hiba történt a betöltéskor. (${res.status})`);
      }

      this.cart = await res.json();

    } catch (e) {
      console.error(e);
      // Network Error detection
      if (e.name === 'TypeError' || e.message.includes('Failed to fetch')) {
        this.error = "Nincs internetkapcsolat. Kérjük ellenőrizze a hálózatot!";
      } else {
        // Show the specific error message thrown above
        this.error = e.message;
      }
    } finally {
      this.isLoading = false;
    }
  },

  async updateQty(item, direction) {
    if (this.isItemUpdating(item.object_id)) return;

    const packStep = parseInt(item.pack_quantity) || 1;
    const currentQty = parseInt(item.qty);
    const newQty = currentQty + (direction * packStep);

    const min = parseInt(item.min_qty) || 1;
    const max = parseInt(item.max_qty) || 999;

    if (newQty < min || newQty > max) return;

    await this.syncItem(item.object_id, newQty);
  },

  async removeItem(item) {
    if (this.isItemUpdating(item.object_id)) return;
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${item.name}" terméket?`)) return;

    await this.syncItem(item.object_id, 0);
  },

  async syncItem(objectId, newQty) {
    this.updatingItems.add(objectId);
    this.updatingItems = new Set(this.updatingItems);

    try {
      const res = await fetch('/api/cart/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_id: objectId, qty: newQty })
      });

      // --- DETAILED ERROR HANDLING FOR ACTIONS ---
      if (!res.ok) {
        if (res.status >= 500) throw new Error("Szerver hiba a mentésnél!");
        if (res.status === 404) throw new Error("A termék már nem elérhető!");
        if (res.status === 400) throw new Error("Érvénytelen mennyiség!");
        throw new Error("Hiba a mentés során.");
      }

      this.cart = await res.json();

    } catch (e) {
      // UX: For actions (like click), alert is often better or toast
      let msg = e.message;
      if (e.name === 'TypeError') {
        msg = "Hálózati hiba! Nem sikerült menteni a módosítást.";
      }

      alert(msg);
    } finally {
      this.updatingItems.delete(objectId);
      this.updatingItems = new Set(this.updatingItems);
    }
  },

  isItemUpdating(id) {
    return this.updatingItems.has(id);
  },

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