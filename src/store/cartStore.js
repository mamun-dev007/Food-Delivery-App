import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clampDiscount, effectivePrice, round2 } from "../utils/pricing";

const AUTH_USER_KEY = "mamun_auth_user";
const CART_KEY = "food-cart";

function currentUserCartKey() {
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    return `${CART_KEY}_${user?.id || "guest"}`;
  } catch {
    return `${CART_KEY}_guest`;
  }
}

const scopedCartStorage = {
  getItem: () => localStorage.getItem(currentUserCartKey()),
  setItem: (_name, value) => localStorage.setItem(currentUserCartKey(), value),
  removeItem: () => localStorage.removeItem(currentUserCartKey()),
};

// The cart always charges the EFFECTIVE (post-discount) price. The original
// price + discount% are kept on the item so cards/cart can show the saving.
// Idempotent: re-adding an already-normalized item never double-discounts.
export const normalizeItem = (food) => {
  const base =
    Number(food.originalPrice != null ? food.originalPrice : food.price) || 0;
  const discount = clampDiscount(food.discount);
  return {
    ...food,
    originalPrice: round2(base),
    discount,
    price: effectivePrice(base, discount),
  };
};

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (food) =>
        set((state) => {
          const item = normalizeItem(food);
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      addItems: (food, qty) =>
        set((state) => {
          const n = Math.max(1, Math.floor(qty) || 1);
          const item = normalizeItem(food);
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + n } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: n }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(0, qty) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: CART_KEY,
      storage: createJSONStorage(() => scopedCartStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (Array.isArray(state?.items)) {
          state.items = state.items.map(normalizeItem);
        }
      },
    }
  )
);