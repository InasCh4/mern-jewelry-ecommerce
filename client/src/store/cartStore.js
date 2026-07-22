import { create } from "zustand";

const getCurrentUser = () => {
  try {
    const savedUser = localStorage.getItem("userInfo");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    return null;
  }
};

const getCartKey = () => {
  const user = getCurrentUser();

  if (user?._id) {
    return `eclora-cart-${user._id}`;
  }

  return "eclora-cart-guest";
};

const loadCart = (key = getCartKey()) => {
  try {
    const savedCart = localStorage.getItem(key);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    if (Array.isArray(parsedCart)) {
      return parsedCart;
    }

    if (parsedCart?.state?.cartItems) {
      return parsedCart.state.cartItems;
    }

    if (parsedCart?.cartItems) {
      return parsedCart.cartItems;
    }

    return [];
  } catch (error) {
    return [];
  }
};

const saveCart = (cartItems, key = getCartKey()) => {
  localStorage.setItem(key, JSON.stringify(cartItems));
};

const mergeCartItems = (userCart, guestCart) => {
  const mergedCart = [...userCart];

  guestCart.forEach((guestItem) => {
    const existingItem = mergedCart.find((item) => item._id === guestItem._id);

    if (existingItem) {
      existingItem.quantity += guestItem.quantity;
    } else {
      mergedCart.push(guestItem);
    }
  });

  return mergedCart;
};

const useCartStore = create((set, get) => ({
  cartItems: loadCart(),

  syncCartWithUser: (mergeGuestCart = false) => {
    const user = getCurrentUser();
    const currentCartKey = getCartKey();

    if (user?._id && mergeGuestCart) {
      const guestCart = loadCart("eclora-cart-guest");
      const userCart = loadCart(currentCartKey);

      const mergedCart = mergeCartItems(userCart, guestCart);

      saveCart(mergedCart, currentCartKey);
      localStorage.removeItem("eclora-cart-guest");

      set({ cartItems: mergedCart });
      return;
    }

    const cartItems = loadCart(currentCartKey);
    set({ cartItems });
  },

  addToCart: (product) => {
    const cartItems = get().cartItems;

    const existingItem = cartItems.find((item) => item._id === product._id);

    let updatedCart;

    if (existingItem) {
      updatedCart = cartItems.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }

    set({ cartItems: updatedCart });
    saveCart(updatedCart);
  },

  increaseQuantity: (id) => {
    const updatedCart = get().cartItems.map((item) =>
      item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
    );

    set({ cartItems: updatedCart });
    saveCart(updatedCart);
  },

  decreaseQuantity: (id) => {
    const cartItems = get().cartItems;

    const item = cartItems.find((item) => item._id === id);

    if (!item) return;

    let updatedCart;

    if (item.quantity === 1) {
      updatedCart = cartItems.filter((item) => item._id !== id);
    } else {
      updatedCart = cartItems.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity - 1 } : item,
      );
    }

    set({ cartItems: updatedCart });
    saveCart(updatedCart);
  },

  removeFromCart: (id) => {
    const updatedCart = get().cartItems.filter((item) => item._id !== id);

    set({ cartItems: updatedCart });
    saveCart(updatedCart);
  },

  clearCart: () => {
    set({ cartItems: [] });
    saveCart([]);
  },

  getTotalItems: () => {
    return get().cartItems.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  },
}));

export default useCartStore;
