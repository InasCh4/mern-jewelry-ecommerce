import { create } from "zustand";
import api from "../api/axios";

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value._id) return value._id.toString();

  return value.toString();
};

const useWishlistStore = create((set, get) => ({
  wishlistItems: [],
  loading: false,
  initialized: false,
  currentUserId: null,

  getWishlist: async (userId, force = false) => {
    if (!userId) return [];

    const state = get();

    if (
      !force &&
      state.initialized &&
      state.currentUserId === userId &&
      Array.isArray(state.wishlistItems)
    ) {
      return state.wishlistItems;
    }

    try {
      set({
        loading: true,
        currentUserId: userId,
      });

      const res = await api.get("/wishlist");

      const wishlist = Array.isArray(res.data) ? res.data : [];

      set({
        wishlistItems: wishlist,
        initialized: true,
        currentUserId: userId,
      });

      return wishlist;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Could not load wishlist.",
      );
    } finally {
      set({ loading: false });
    }
  },

  refreshWishlist: async (userId) => {
    return get().getWishlist(userId, true);
  },

  toggleWishlist: async (productId, userId) => {
    try {
      set({ loading: true });

      const res = await api.post(`/wishlist/${productId}`);

      const wishlist = Array.isArray(res.data.wishlist)
        ? res.data.wishlist
        : [];

      set({
        wishlistItems: wishlist,
        initialized: true,
        currentUserId: userId || get().currentUserId,
      });

      return {
        ...res.data,
        wishlist,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Could not update wishlist.",
      );
    } finally {
      set({ loading: false });
    }
  },

  removeFromWishlist: async (productId, userId) => {
    try {
      set({ loading: true });

      const res = await api.delete(`/wishlist/${productId}`);

      const wishlist = Array.isArray(res.data.wishlist)
        ? res.data.wishlist
        : [];

      set({
        wishlistItems: wishlist,
        initialized: true,
        currentUserId: userId || get().currentUserId,
      });

      return {
        ...res.data,
        wishlist,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Could not remove product from wishlist.",
      );
    } finally {
      set({ loading: false });
    }
  },

  isInWishlist: (productId) => {
    const targetId = normalizeId(productId);

    return get().wishlistItems.some((product) => {
      const itemId = normalizeId(product);

      return itemId === targetId;
    });
  },

  clearWishlistState: () => {
    set({
      wishlistItems: [],
      loading: false,
      initialized: false,
      currentUserId: null,
    });
  },
}));

export default useWishlistStore;
