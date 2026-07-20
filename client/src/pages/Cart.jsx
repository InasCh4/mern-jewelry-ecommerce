import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import useCartStore from "../store/cartStore";

const Cart = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.getTotalPrice());

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
            onClick={clearCart}
            className="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-900 hover:text-stone-950"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="grid gap-5 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[150px_1fr] sm:items-center"
              >
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  className="h-40 w-full rounded-2xl object-cover sm:h-32"
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                      {item.category}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-stone-950">
                      {item.name}
                    </h2>

                    <p className="mt-1 text-stone-500">{item.price} DA</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-stone-200">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        className="grid h-10 w-10 place-items-center"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="grid h-10 w-10 place-items-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-950">Order Summary</h2>

            <div className="mt-6 space-y-4 text-stone-600">
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
