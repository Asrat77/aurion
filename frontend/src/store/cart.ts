import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/types";

interface CartState {
  items: CartLine[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, delta: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                emoji: product.emoji,
                priceCents: product.priceCents,
                qty: 1,
                vendorName: product.vendor.storeName,
              },
            ],
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQty: (productId, delta) => {
        const items = get().items;
        const next = items
          .map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i))
          .filter((i) => i.qty > 0);
        set({ items: next });
      },
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: "aurion_cart", partialize: (state) => ({ items: state.items }) }
  )
);

export function cartTotalCents(items: CartLine[]) {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

export function cartItemCount(items: CartLine[]) {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
