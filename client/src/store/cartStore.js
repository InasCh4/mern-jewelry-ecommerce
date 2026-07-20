import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      addToCart: (product) => {
        const cartItems = get().cartItems;

        const existingItem = cartItems.find((item) => item._id === product._id);

        if (existingItem) {
          set({
            cartItems: cartItems.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({
            cartItems: [...cartItems, { ...product, quantity: 1 }],
          });
        }
      },

      increaseQuantity: (id) => {
        set({
          cartItems: get().cartItems.map((item) =>
            item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        });
      },

      decreaseQuantity: (id) => {
        const cartItems = get().cartItems;

        const item = cartItems.find((item) => item._id === id);

        if (item.quantity === 1) {
          set({
            cartItems: cartItems.filter((item) => item._id !== id),
          });
        } else {
          set({
            cartItems: cartItems.map((item) =>
              item._id === id ? { ...item, quantity: item.quantity - 1 } : item,
            ),
          });
        }
      },

      removeFromCart: (id) => {
        set({
          cartItems: get().cartItems.filter((item) => item._id !== id),
        });
      },

      clearCart: () => {
        set({ cartItems: [] });
      },

      getTotalItems: () => {
        return get().cartItems.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      },

      getTotalPrice: () => {
        return get().cartItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "eclora-cart",
    },
  ),
);

export default useCartStore;
