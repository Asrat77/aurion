import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/types";

interface CartState {
  items: CartLine[];
  isOpen: boolean;
  addItem: (product: Product, qty?: number) => void;
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
      // Quantity is clamped to what the vendor actually has, so the cart can
      // never ask for more than checkout will accept.
      addItem: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        const wanted = Math.max(1, Math.floor(qty));

        if (existing) {
          const capped = Math.min(existing.qty + wanted, product.stock);
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, qty: Math.max(1, capped) } : i
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
                qty: Math.max(1, Math.min(wanted, product.stock)),
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
