import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";

const Cart = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const totalSavings = cartItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const oldPrice = Number(item.oldPrice || 0);
    const quantity = Number(item.quantity || 1);
    const discountPercent = Number(item.discountPercent || 0);

    if (oldPrice > price && discountPercent > 0) {
      return sum + (oldPrice - price) * quantity;
    }

    return sum;
  }, 0);

  const subtotalBeforeDiscount = Number(totalPrice || 0) + totalSavings;

  const handleIncreaseQuantity = (item) => {
    increaseQuantity(item._id);
  };

  const handleDecreaseQuantity = (item) => {
    decreaseQuantity(item._id);

    if (item.quantity === 1) {
      toast.success(`${item.name} removed from cart.`);
    }
  };

  const handleRemoveFromCart = (item) => {
    removeFromCart(item._id);
    toast.success(`${item.name} removed from cart.`);
  };

  const handleClearCart = () => {
    const confirmClear = window.confirm("Clear all items from your cart?");

    if (!confirmClear) return;

    clearCart();
    toast.success("Cart cleared successfully.");
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-stone-100">
            <ShoppingBag size={28} />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-stone-950">
            Your cart is empty
          </h1>

          <p className="mt-3 text-stone-500">
            Add some elegant pieces and come back here.
          </p>

          <Link
            to="/#products"
            className="mt-8 inline-flex rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Shopping Cart
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Your Pieces
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            className="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {cartItems.map((item) => {
              const price = Number(item.price || 0);
              const oldPrice = Number(item.oldPrice || 0);
              const discountPercent = Number(item.discountPercent || 0);
              const quantity = Number(item.quantity || 1);
              const hasDiscount = oldPrice > price && discountPercent > 0;
              const itemTotal = price * quantity;

              return (
                <div
                  key={item._id}
                  className="grid gap-5 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[150px_1fr] sm:items-center"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    {hasDiscount && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        -{discountPercent}%
                      </span>
                    )}

                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                      className="h-40 w-full object-cover sm:h-32"
                    />
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                        {item.category}
                      </p>

                      <h2 className="mt-2 text-xl font-bold text-stone-950">
                        {item.name}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="whitespace-nowrap text-sm font-semibold text-stone-700">
                          {price} DA
                        </p>

                        {hasDiscount && (
                          <>
                            <p className="whitespace-nowrap text-xs text-stone-400 line-through">
                              {oldPrice} DA
                            </p>

                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                              Sale
                            </span>
                          </>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-stone-500">
                        Line total:{" "}
                        <span className="font-semibold text-stone-900">
                          {itemTotal} DA
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-full border border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleDecreaseQuantity(item)}
                          className="grid h-10 w-10 place-items-center transition hover:text-red-500"
                        >
                          <Minus size={16} />
                        </button>

                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleIncreaseQuantity(item)}
                          className="grid h-10 w-10 place-items-center transition hover:text-green-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item)}
                        className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-950">Order Summary</h2>

            <div className="mt-6 space-y-4 text-stone-600">
              {totalSavings > 0 && (
                <div className="flex justify-between">
                  <span>Before discount</span>
                  <span className="line-through">
                    {subtotalBeforeDiscount} DA
                  </span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>You save</span>
                  <span>-{totalSavings} DA</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{totalPrice} DA</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>To confirm</span>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <div className="flex justify-between text-xl font-bold text-stone-950">
                  <span>Total</span>
                  <span>{totalPrice} DA</span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-8 block w-full rounded-full bg-stone-950 px-6 py-4 text-center text-white transition hover:bg-stone-700"
            >
              Checkout
            </Link>

            <Link
              to="/#products"
              className="mt-4 block text-center text-sm text-stone-500 hover:text-stone-950"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
