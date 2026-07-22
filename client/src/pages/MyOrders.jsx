import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import api from "../api/axios";

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/orders/my-orders");
      setOrders(res.data);
    } catch (error) {
      setError(error.response?.data?.message || "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-bold text-stone-950">My Orders</h1>

          <p className="mt-3 text-stone-500">
            Track your ECLORA orders and their status.
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {orders.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
            <ShoppingBag size={42} className="mx-auto text-stone-300" />

            <h2 className="mt-4 text-2xl font-bold text-stone-950">
              No orders yet
            </h2>

            <p className="mt-2 text-stone-500">
              Your future jewelry treasures will appear here.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-[2rem] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-100">
                      <Package size={22} className="text-stone-700" />
                    </div>

                    <div>
                      <p className="font-semibold text-stone-950">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>

                      <p className="text-sm text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                        statusStyles[order.orderStatus] ||
                        "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {order.orderStatus}
                    </span>

                    <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700">
                      {order.totalPrice} DA
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {order.orderItems.map((item) => (
                    <div
                      key={item.product}
                      className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />

                      <div className="flex-1">
                        <p className="font-semibold text-stone-950">
                          {item.name}
                        </p>

                        <p className="text-sm text-stone-500">
                          Qty: {item.quantity} × {item.price} DA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 text-sm text-stone-600 md:grid-cols-3">
                  <p>
                    <span className="font-medium text-stone-950">
                      Delivery:
                    </span>{" "}
                    {order.deliveryMethod}
                  </p>

                  <p>
                    <span className="font-medium text-stone-950">Payment:</span>{" "}
                    {order.paymentMethod}
                  </p>

                  <p>
                    <span className="font-medium text-stone-950">
                      Payment status:
                    </span>{" "}
                    {order.paymentStatus}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrders;
