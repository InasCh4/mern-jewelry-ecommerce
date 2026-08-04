import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const timelineSteps = ["pending", "confirmed", "shipped", "delivered"];

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      const message = error.response?.data?.message || "Could not load order.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const currentStepIndex = useMemo(() => {
    if (!order || order.orderStatus === "cancelled") return -1;

    return timelineSteps.indexOf(order.orderStatus);
  }, [order]);

  const totalSavings = useMemo(() => {
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
  }, [order]);

  const subtotalBeforeDiscount =
    Number(order?.subtotalPrice || 0) + totalSavings;

  const handleCancelOrder = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmCancel) return;

    const toastId = toast.loading("Cancelling order...");

    try {
      setCancelling(true);
      setError("");

      const res = await api.patch(`/orders/${order._id}/cancel`);

      await sleep(700);

      setOrder(res.data);

      toast.success("Order cancelled successfully.", {
        id: toastId,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not cancel this order.";

      setError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading order details...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-950">Order not found</h1>

          <p className="mt-3 text-stone-500">
            {error || "This order does not exist or you cannot access it."}
          </p>

          <Link
            to="/my-orders"
            className="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
          >
            Back to my orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Order details
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              #{order._id.slice(-6).toUpperCase()}
            </h1>

            <p className="mt-3 text-stone-500">
              Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
            </p>
          </div>

          <Link
            to="/my-orders"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <ArrowLeft size={16} />
            Back to my orders
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-950">
                    Order status
                  </h2>

                  <p className="mt-2 text-stone-500">
                    Follow your order journey.
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                    statusStyles[order.orderStatus] ||
                    "bg-stone-100 text-stone-600"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              {order.orderStatus === "cancelled" ? (
                <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-600">
                  This order has been cancelled.
                </div>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-4">
                  {timelineSteps.map((step, index) => {
                    const isActive = index <= currentStepIndex;

                    return (
                      <div
                        key={step}
                        className={`rounded-2xl border p-4 ${
                          isActive
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-100 bg-stone-50 text-stone-400"
                        }`}
                      >
                        <CheckCircle2 size={22} />

                        <p className="mt-3 text-sm font-semibold capitalize">
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-bold text-stone-950">Products</h2>

              <div className="mt-6 space-y-4">
                {order.orderItems?.map((item) => {
                  const price = Number(item.price || 0);
                  const oldPrice = Number(item.oldPrice || 0);
                  const quantity = Number(item.quantity || 1);
                  const discountPercent = Number(item.discountPercent || 0);
                  const hasDiscount = oldPrice > price && discountPercent > 0;
                  const lineTotal = price * quantity;

                  return (
                    <div
                      key={`${order._id}-${item.product}`}
                      className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                        {hasDiscount && (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
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
                          <p className="truncate font-bold text-stone-950">
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
                            <span className="line-through">{oldPrice} DA</span>
                          </p>
                        )}
                      </div>

                      <p className="whitespace-nowrap font-bold text-stone-950">
                        {lineTotal} DA
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-bold text-stone-950">
                Delivery information
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-center gap-3 text-stone-950">
                    <User size={18} />
                    <h3 className="font-bold">Customer</h3>
                  </div>

                  <p className="mt-3 text-stone-600">
                    {order.customerInfo?.fullName}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4">
                  <div className="flex items-center gap-3 text-stone-950">
                    <Phone size={18} />
                    <h3 className="font-bold">Phone</h3>
                  </div>

                  <p className="mt-3 text-stone-600">
                    {order.customerInfo?.phone}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-4 md:col-span-2">
                  <div className="flex items-center gap-3 text-stone-950">
                    <MapPin size={18} />
                    <h3 className="font-bold">Address</h3>
                  </div>

                  <p className="mt-3 leading-7 text-stone-600">
                    {order.customerInfo?.address}
                  </p>

                  <p className="mt-2 text-sm text-stone-500">
                    {order.customerInfo?.commune}, {order.customerInfo?.wilaya}
                  </p>
                </div>

                {order.customerInfo?.note && (
                  <div className="rounded-2xl bg-amber-50 p-4 md:col-span-2">
                    <p className="font-semibold text-amber-700">
                      Delivery note
                    </p>

                    <p className="mt-2 text-stone-700">
                      {order.customerInfo.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="h-fit space-y-6">
            <div className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Summary</h2>

              <div className="mt-6 space-y-4 text-sm text-stone-600">
                {totalSavings > 0 && (
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <span className="min-w-0">Before discount</span>

                    <span className="whitespace-nowrap text-right line-through">
                      {subtotalBeforeDiscount} DA
                    </span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 text-red-600">
                    <span className="min-w-0">You save</span>

                    <span className="whitespace-nowrap text-right">
                      -{totalSavings} DA
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <span className="min-w-0">Subtotal</span>

                  <span className="whitespace-nowrap text-right">
                    {order.subtotalPrice} DA
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <span className="min-w-0">Delivery</span>

                  <span className="whitespace-nowrap text-right">
                    {order.deliveryPrice} DA
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-stone-100 pt-4 text-xl font-bold text-stone-950">
                  <span className="min-w-0">Total</span>

                  <span className="whitespace-nowrap text-right">
                    {order.totalPrice} DA
                  </span>
                </div>
              </div>
            </div>

            {order.orderStatus === "pending" && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-stone-950">
                  Order action
                </h2>

                <p className="mt-3 text-sm text-stone-500">
                  You can cancel this order while it is still pending.
                </p>

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-6 py-3 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={18} />
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              </div>
            )}

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Payment</h2>

              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <div className="flex items-center gap-3 text-stone-950">
                  <CreditCard size={18} />
                  <p className="font-bold capitalize">{order.paymentMethod}</p>
                </div>

                <p className="mt-3 text-sm capitalize text-stone-500">
                  Status: {order.paymentStatus}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Delivery</h2>

              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <div className="flex items-center gap-3 text-stone-950">
                  <Truck size={18} />
                  <p className="font-bold capitalize">{order.deliveryMethod}</p>
                </div>

                <p className="mt-3 text-sm text-stone-500">
                  Current status:{" "}
                  <span className="capitalize">{order.orderStatus}</span>
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-stone-950 p-6 text-white">
              <Package size={24} />

              <h3 className="mt-4 text-xl font-bold">Need help?</h3>

              <p className="mt-2 text-sm text-white/70">
                Save your order number and contact ECLORA support if needed.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrderDetails;
