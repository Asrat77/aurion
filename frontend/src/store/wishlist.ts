import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: number[];
  toggle: (id: number) => boolean; // returns true if now in wishlist
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids;
        if (ids.includes(id)) {
          set({ ids: ids.filter((i) => i !== id) });
          return false;
        }
        set({ ids: [...ids, id] });
        return true;
      },
    }),
    { name: "aurion_wishlist" }
  )
);
