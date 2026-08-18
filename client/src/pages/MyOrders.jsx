import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  ImagePlus,
  Package,
  ShoppingBag,
} from "lucide-react";
import api from "../api/axios";

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const paymentStatusStyles = {
  unpaid: "bg-stone-100 text-stone-600",
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
};

const paymentMethodLabels = {
  cash: "Cash on delivery",
  baridimob: "BaridiMob",
  card: "Card payment",
};

const paymentStatusLabels = {
  unpaid: "Unpaid",
  pending: "Pending verification",
  paid: "Paid",
  failed: "Failed",
};

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} DA`;

const formatPaymentMethod = (method) => {
  return paymentMethodLabels[method] || method || "Unknown";
};

const formatPaymentStatus = (status) => {
  return paymentStatusLabels[status] || status || "Unknown";
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

const getPaymentNotice = (order) => {
  if (order.paymentMethod === "cash") {
    return {
      label: "Pay on delivery",
      description: "You will pay when your order arrives.",
      style: "bg-stone-100 text-stone-700",
      icon: CreditCard,
    };
  }

  if (order.paymentMethod === "baridimob") {
    if (order.paymentStatus === "paid") {
      return {
        label: "Payment verified",
        description: "Your BaridiMob payment has been confirmed.",
        style: "bg-green-50 text-green-700",
        icon: CheckCircle2,
      };
    }

    if (order.paymentStatus === "failed") {
      return {
        label: "Payment failed",
        description: "Please contact the shop for payment support.",
        style: "bg-red-50 text-red-700",
        icon: AlertCircle,
      };
    }

    if (order.paymentProof?.imageUrl) {
      return {
        label: "Proof uploaded",
        description:
          "Your receipt was uploaded and is waiting for verification.",
        style: "bg-green-50 text-green-700",
        icon: ImagePlus,
      };
    }

    return {
      label: "Upload receipt needed",
      description: "Upload your BaridiMob receipt from the order details page.",
      style: "bg-amber-50 text-amber-700",
      icon: AlertCircle,
    };
  }

  if (order.paymentMethod === "card") {
    if (order.paymentStatus === "paid") {
      return {
        label: "Payment verified",
        description: "Your card payment has been confirmed.",
        style: "bg-green-50 text-green-700",
        icon: CheckCircle2,
      };
    }

    return {
      label: "Card payment pending",
      description: "Card payment provider will verify this payment later.",
      style: "bg-amber-50 text-amber-700",
      icon: CreditCard,
    };
  }

  return {
    label: formatPaymentStatus(order.paymentStatus),
    description: "Payment status will be updated by the shop.",
    style: "bg-stone-100 text-stone-700",
    icon: CreditCard,
  };
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
            Track your ECLORA orders, payment status, and delivery updates.
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
              const paymentNotice = getPaymentNotice(order);
              const PaymentNoticeIcon = paymentNotice.icon;

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
                          Saved {formatPrice(totalSavings)}
                        </span>
                      )}

                      <span className="whitespace-nowrap rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700">
                        {formatPrice(order.totalPrice)}
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

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                      {order.orderItems.map((item) => {
                        const price = Number(item.price || 0);
                        const oldPrice = Number(item.oldPrice || 0);
                        const quantity = Number(item.quantity || 1);
                        const discountPercent = Number(
                          item.discountPercent || 0,
                        );
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
                                Qty: {quantity} × {formatPrice(price)}
                              </p>

                              {hasDiscount && (
                                <p className="mt-0.5 text-xs text-stone-400">
                                  Old price:{" "}
                                  <span className="line-through">
                                    {formatPrice(oldPrice)}
                                  </span>
                                </p>
                              )}
                            </div>

                            <p className="whitespace-nowrap text-sm font-semibold text-stone-950">
                              {formatPrice(lineTotal)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <div className={`rounded-2xl p-4 ${paymentNotice.style}`}>
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80">
                            <PaymentNoticeIcon size={18} />
                          </div>

                          <div>
                            <p className="font-bold">{paymentNotice.label}</p>

                            <p className="mt-1 text-sm leading-6 opacity-80">
                              {paymentNotice.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
                        <p>
                          <span className="font-medium text-stone-950">
                            Delivery:
                          </span>{" "}
                          <span className="capitalize">
                            {order.deliveryMethod}
                          </span>
                        </p>

                        <p>
                          <span className="font-medium text-stone-950">
                            Payment:
                          </span>{" "}
                          {formatPaymentMethod(order.paymentMethod)}
                        </p>

                        <p>
                          <span className="font-medium text-stone-950">
                            Payment status:
                          </span>{" "}
                          <span
                            className={`ml-1 rounded-full px-2 py-1 text-xs font-semibold ${
                              paymentStatusStyles[order.paymentStatus] ||
                              "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {formatPaymentStatus(order.paymentStatus)}
                          </span>
                        </p>

                        {order.paymentProof?.imageUrl && (
                          <a
                            href={order.paymentProof.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <ImagePlus size={14} />
                            View uploaded receipt
                          </a>
                        )}

                        {order.paymentMethod === "baridimob" &&
                          order.paymentStatus === "pending" &&
                          !order.paymentProof?.imageUrl && (
                            <Link
                              to={`/my-orders/${order._id}`}
                              className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                            >
                              <AlertCircle size={14} />
                              Upload receipt
                            </Link>
                          )}
                      </div>
                    </div>
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
