import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Package, ShoppingBag } from "lucide-react";
import api from "../api/axios";

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const getOrderSavings = (order) => {
  if (!order?.orderItems?.length) return 0;

  return order.orderItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const oldPrice = Number(item.oldPrice || 0);
    const quantity = Number(item.quantity || 1);
    const discountPercent = Number(item.discountPercent || 0);

    if (oldPrice > price && discountPercent > 0) {
      return sum + (oldPrice - price) * quantity;
    }

    return sum;
  }, 0);
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
              to="/#products"
              className="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const totalSavings = getOrderSavings(order);

              return (
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
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-GB",
                          )}
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

                      {totalSavings > 0 && (
                        <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                          Saved {totalSavings} DA
                        </span>
                      )}

                      <span className="whitespace-nowrap rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700">
                        {order.totalPrice} DA
                      </span>

                      <Link
                        to={`/my-orders/${order._id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                      >
                        <Eye size={16} />
                        Details
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {order.orderItems.map((item) => {
                      const price = Number(item.price || 0);
                      const oldPrice = Number(item.oldPrice || 0);
                      const quantity = Number(item.quantity || 1);
                      const discountPercent = Number(item.discountPercent || 0);
                      const hasDiscount =
                        oldPrice > price && discountPercent > 0;
                      const lineTotal = price * quantity;

                      return (
                        <div
                          key={`${order._id}-${item.product}`}
                          className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                            {hasDiscount && (
                              <span className="absolute left-1 top-1 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                -{discountPercent}%
                              </span>
                            )}

                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-stone-950">
                                {item.name}
                              </p>

                              {hasDiscount && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                  Sale
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-stone-500">
                              Qty: {quantity} × {price} DA
                            </p>

                            {hasDiscount && (
                              <p className="mt-0.5 text-xs text-stone-400">
                                Old price:{" "}
                                <span className="line-through">
                                  {oldPrice} DA
                                </span>
                              </p>
                            )}
                          </div>

                          <p className="whitespace-nowrap text-sm font-semibold text-stone-950">
                            {lineTotal} DA
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-stone-600 md:grid-cols-3">
                    <p>
                      <span className="font-medium text-stone-950">
                        Delivery:
                      </span>{" "}
                      {order.deliveryMethod}
                    </p>

                    <p>
                      <span className="font-medium text-stone-950">
                        Payment:
                      </span>{" "}
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrders;
