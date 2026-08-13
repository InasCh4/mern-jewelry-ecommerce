import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Eye,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Receipt,
  RefreshCcw,
  Search,
  Truck,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const orderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const paymentStatuses = ["unpaid", "pending", "paid", "failed"];

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const paymentStyles = {
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

const defaultSiteSettings = {
  shopName: "ECLORA",
};

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} DA`;

const formatPaymentMethod = (method) => {
  return paymentMethodLabels[method] || method || "Unknown";
};

const normalizeDzPhoneForWhatsApp = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00213")) {
    return digits.slice(2);
  }

  if (digits.startsWith("213")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `213${digits.slice(1)}`;
  }

  if (digits.length === 9 && ["5", "6", "7"].includes(digits.charAt(0))) {
    return `213${digits}`;
  }

  return digits;
};

const getOrderStatusMessage = (status) => {
  const messages = {
    pending: "a bien été reçue",
    confirmed: "est confirmée",
    shipped: "est en cours de livraison",
    delivered: "a été livrée",
    cancelled: "a été annulée",
  };

  return messages[status] || "a été mise à jour";
};

const getPaymentStatusMessage = (status) => {
  const messages = {
    unpaid: "non payé",
    pending: "en attente de vérification",
    paid: "payé",
    failed: "échoué",
  };

  return messages[status] || status || "non défini";
};

const getPaymentMessageLines = (order) => {
  if (order.paymentMethod === "cash") {
    return [
      "Paiement : à la livraison",
      `Montant à payer : ${formatPrice(order.totalPrice)}`,
    ];
  }

  if (order.paymentMethod === "baridimob") {
    return [
      "Paiement : BaridiMob",
      `Statut paiement : ${getPaymentStatusMessage(order.paymentStatus)}`,
    ];
  }

  if (order.paymentMethod === "card") {
    return [
      "Paiement : carte bancaire",
      `Statut paiement : ${getPaymentStatusMessage(order.paymentStatus)}`,
    ];
  }

  return [
    `Paiement : ${formatPaymentMethod(order.paymentMethod)}`,
    `Statut paiement : ${getPaymentStatusMessage(order.paymentStatus)}`,
  ];
};

const buildWhatsAppOrderMessage = (order, shopName) => {
  const orderNumber = `#${order._id.slice(-6).toUpperCase()}`;
  const customerName = order.customerInfo?.fullName || "cliente";

  const itemsText =
    order.orderItems
      ?.map((item) => `- ${item.name} x${item.quantity}`)
      .join("\n") || "- Articles de la commande";

  const orderStatusText = getOrderStatusMessage(order.orderStatus);
  const paymentLines = getPaymentMessageLines(order).join("\n");

  return `Bonjour ${customerName},

Votre commande ${orderNumber} ${orderStatusText}.

Articles :
${itemsText}

Total : ${formatPrice(order.totalPrice)}
Livraison : ${order.customerInfo?.commune || ""}, ${
    order.customerInfo?.wilaya || ""
  }
${paymentLines}

Merci pour votre achat chez ${shopName}.`;
};

const getWorkflowConfig = (order) => {
  if (!order) {
    return {
      label: "Confirm + WhatsApp",
      disabled: true,
      updateData: {},
      help: "",
    };
  }

  if (order.orderStatus === "cancelled") {
    return {
      label: "Order cancelled",
      disabled: true,
      updateData: {},
      help: "Cancelled orders cannot be confirmed.",
    };
  }

  if (order.orderStatus === "delivered") {
    return {
      label: "Send WhatsApp only",
      disabled: false,
      updateData: {},
      help: "This order is already delivered.",
    };
  }

  if (order.paymentMethod === "cash") {
    if (order.orderStatus === "confirmed") {
      return {
        label: "Send confirmation WhatsApp",
        disabled: false,
        updateData: {},
        help: "Cash orders stay unpaid until delivery.",
      };
    }

    return {
      label: "Confirm order + WhatsApp",
      disabled: false,
      updateData: {
        orderStatus: "confirmed",
      },
      help: "For cash on delivery, payment stays unpaid until the client receives the order.",
    };
  }

  if (order.paymentMethod === "baridimob") {
    if (order.paymentStatus === "paid" && order.orderStatus === "confirmed") {
      return {
        label: "Send confirmation WhatsApp",
        disabled: false,
        updateData: {},
        help: "Payment and order are already confirmed.",
      };
    }

    if (order.paymentStatus === "paid") {
      return {
        label: "Confirm order + WhatsApp",
        disabled: false,
        updateData: {
          orderStatus: "confirmed",
        },
        help: "Payment is already paid. This action confirms the order.",
      };
    }

    return {
      label: "Confirm payment + order + WhatsApp",
      disabled: false,
      updateData: {
        paymentStatus: "paid",
        orderStatus: "confirmed",
      },
      help: "Use this only after checking the BaridiMob receipt.",
    };
  }

  if (order.paymentMethod === "card") {
    if (order.paymentStatus !== "paid") {
      return {
        label: "Waiting for card payment",
        disabled: true,
        updateData: {},
        help: "Card payment should be validated by the payment provider later.",
      };
    }

    if (order.orderStatus === "confirmed") {
      return {
        label: "Send confirmation WhatsApp",
        disabled: false,
        updateData: {},
        help: "Card payment is paid and order is confirmed.",
      };
    }

    return {
      label: "Confirm order + WhatsApp",
      disabled: false,
      updateData: {
        orderStatus: "confirmed",
      },
      help: "Card payment is already paid. This action confirms the order.",
    };
  }

  return {
    label: "Confirm order + WhatsApp",
    disabled: false,
    updateData: {
      orderStatus: "confirmed",
    },
    help: "Confirm this order and prepare a WhatsApp message.",
  };
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

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [workflowUpdatingId, setWorkflowUpdatingId] = useState("");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const syncUpdatedOrder = (updatedOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order,
      ),
    );

    setSelectedOrder((prevOrder) =>
      prevOrder?._id === updatedOrder._id
        ? { ...prevOrder, ...updatedOrder }
        : prevOrder,
    );
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersRes, siteSettingsRes] = await Promise.all([
        api.get("/orders"),
        api.get("/site-settings"),
      ]);

      setOrders(ordersRes.data);

      setSiteSettings({
        ...defaultSiteSettings,
        ...siteSettingsRes.data,
      });
    } catch (error) {
      const message = error.response?.data?.message || "Could not load orders.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openWhatsAppForOrder = (order) => {
    const phone = normalizeDzPhoneForWhatsApp(order.customerInfo?.phone);

    if (!phone) {
      toast.error("Customer phone number is missing.");
      return;
    }

    const message = buildWhatsAppOrderMessage(
      order,
      siteSettings.shopName || "ECLORA",
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const updateOrder = async (orderId, updateData) => {
    const isOrderStatusUpdate = Object.prototype.hasOwnProperty.call(
      updateData,
      "orderStatus",
    );

    const isPaymentStatusUpdate = Object.prototype.hasOwnProperty.call(
      updateData,
      "paymentStatus",
    );

    const toastId = toast.loading(
      isOrderStatusUpdate
        ? "Updating order status..."
        : "Updating payment status...",
    );

    try {
      setUpdatingId(orderId);
      setError("");

      const res = await api.patch(`/orders/${orderId}/status`, updateData);

      await sleep(500);

      syncUpdatedOrder(res.data);

      if (isOrderStatusUpdate) {
        toast.success(`Order marked as ${res.data.orderStatus}.`, {
          id: toastId,
        });
      }

      if (isPaymentStatusUpdate) {
        toast.success(`Payment marked as ${res.data.paymentStatus}.`, {
          id: toastId,
        });
      }

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not update order.";

      setError(message);

      toast.error(message, {
        id: toastId,
      });

      return null;
    } finally {
      setUpdatingId("");
    }
  };

  const handleWorkflowConfirm = async (order) => {
    const workflow = getWorkflowConfig(order);

    if (workflow.disabled) {
      toast.error(workflow.help || "This action is not available.");
      return;
    }

    const shouldUpdateOrder = Object.keys(workflow.updateData).length > 0;

    if (!shouldUpdateOrder) {
      openWhatsAppForOrder(order);
      return;
    }

    const confirmMessage =
      order.paymentMethod === "baridimob" && order.paymentStatus !== "paid"
        ? "Did you verify the BaridiMob receipt before confirming payment?"
        : "Confirm this order and open WhatsApp message?";

    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    const toastId = toast.loading("Confirming order workflow...");

    try {
      setWorkflowUpdatingId(order._id);
      setError("");

      const res = await api.patch(`/orders/${order._id}/status`, {
        ...workflow.updateData,
      });

      await sleep(500);

      syncUpdatedOrder(res.data);

      toast.success("Order workflow confirmed. WhatsApp message is ready.", {
        id: toastId,
      });

      openWhatsAppForOrder(res.data);
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not confirm this order.";

      setError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setWorkflowUpdatingId("");
    }
  };

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.orderStatus === "pending").length,
      delivered: orders.filter((order) => order.orderStatus === "delivered")
        .length,
      cancelled: orders.filter((order) => order.orderStatus === "cancelled")
        .length,
      paymentPending: orders.filter(
        (order) => order.paymentStatus === "pending",
      ).length,
      paid: orders.filter((order) => order.paymentStatus === "paid").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order._id?.toLowerCase().includes(query) ||
        order.customerInfo?.fullName?.toLowerCase().includes(query) ||
        order.customerInfo?.phone?.toLowerCase().includes(query) ||
        order.customerInfo?.wilaya?.toLowerCase().includes(query) ||
        order.customerInfo?.commune?.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query) ||
        order.paymentMethod?.toLowerCase().includes(query) ||
        order.paymentStatus?.toLowerCase().includes(query) ||
        order.orderItems?.some((item) =>
          item.name?.toLowerCase().includes(query),
        );

      const matchesOrderStatus =
        orderStatusFilter === "all" || order.orderStatus === orderStatusFilter;

      const matchesPaymentStatus =
        paymentStatusFilter === "all" ||
        order.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesOrderStatus && matchesPaymentStatus;
    });
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter]);

  const selectedOrderSavings = getOrderSavings(selectedOrder);
  const selectedSubtotalBeforeDiscount =
    Number(selectedOrder?.subtotalPrice || 0) + selectedOrderSavings;

  const selectedWorkflow = getWorkflowConfig(selectedOrder);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">Orders</h1>

            <p className="mt-3 text-stone-500">
              Manage customer orders, delivery status, and payment validation.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Total orders</p>

            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.total}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Pending orders</p>

            <h2 className="mt-2 text-3xl font-bold text-amber-500">
              {stats.pending}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Delivered</p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {stats.delivered}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Cancelled</p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {stats.cancelled}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Payment pending</p>

            <h2 className="mt-2 text-3xl font-bold text-amber-500">
              {stats.paymentPending}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Paid</p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {stats.paid}
            </h2>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-950">Order List</h2>

              <p className="mt-1 text-stone-500">
                Showing {filteredOrders.length} of {orders.length} orders.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 px-11 py-3 outline-none focus:border-stone-900"
                  placeholder="Search client, phone, product, payment..."
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="rounded-2xl border border-stone-200 px-4 py-3 capitalize outline-none focus:border-stone-900"
              >
                <option value="all">All orders</option>

                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="rounded-2xl border border-stone-200 px-4 py-3 capitalize outline-none focus:border-stone-900"
              >
                <option value="all">All payments</option>

                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1480px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-stone-400">
                  <th className="w-[130px] py-4 pr-5 font-medium">Order</th>
                  <th className="w-[240px] py-4 pr-5 font-medium">Customer</th>
                  <th className="w-[180px] py-4 pr-5 font-medium">Location</th>
                  <th className="w-[140px] py-4 pr-6 font-medium">Total</th>
                  <th className="w-[170px] py-4 pr-5 font-medium">
                    Order status
                  </th>
                  <th className="w-[230px] py-4 pr-5 font-medium">Payment</th>
                  <th className="w-[230px] py-4 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-5 pr-5">
                      <p className="font-bold text-stone-950">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>

                      <p className="mt-1 whitespace-nowrap text-xs text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </td>

                    <td className="py-5 pr-5">
                      <p className="font-semibold text-stone-950">
                        {order.customerInfo?.fullName}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        {order.customerInfo?.phone}
                      </p>

                      <p className="mt-1 max-w-[210px] truncate text-xs text-stone-400">
                        {order.user?.email || "Old order / no user"}
                      </p>
                    </td>

                    <td className="py-5 pr-5 text-stone-600">
                      <p className="font-medium">
                        {order.customerInfo?.wilaya}
                      </p>

                      <p className="text-xs text-stone-400">
                        {order.customerInfo?.commune}
                      </p>
                    </td>

                    <td className="w-[140px] py-5 pr-6">
                      <span className="block whitespace-nowrap text-base font-semibold text-stone-950">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </td>

                    <td className="py-5 pr-5">
                      <select
                        value={order.orderStatus}
                        disabled={updatingId === order._id}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            orderStatus: e.target.value,
                          })
                        }
                        className={`min-w-[135px] rounded-full px-3 py-2 text-xs font-semibold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                          statusStyles[order.orderStatus] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-5 pr-5">
                      <div className="flex flex-col gap-2">
                        <p className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                          <CreditCard size={14} />
                          {formatPaymentMethod(order.paymentMethod)}
                        </p>

                        <select
                          value={order.paymentStatus || "unpaid"}
                          disabled={updatingId === order._id}
                          onChange={(e) =>
                            updateOrder(order._id, {
                              paymentStatus: e.target.value,
                            })
                          }
                          className={`min-w-[120px] rounded-full px-3 py-2 text-xs font-semibold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            paymentStyles[order.paymentStatus] ||
                            "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {paymentStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openWhatsAppForOrder(order)}
                          className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-100"
                        >
                          <MessageCircle size={15} />
                          WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-700 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white"
                        >
                          <Eye size={15} />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="py-12 text-center">
                <Package size={34} className="mx-auto text-stone-300" />

                <p className="mt-3 text-stone-500">
                  No orders match these filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[70] bg-black/30 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 h-full w-full"
            aria-label="Close order details"
          />

          <aside className="relative z-10 ml-auto h-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-start justify-between gap-4 border-b border-stone-100 bg-white/95 p-6 backdrop-blur-xl">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
                  Order details
                </p>

                <h2 className="mt-2 text-2xl font-bold text-stone-950">
                  #{selectedOrder._id.slice(-6).toUpperCase()}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {new Date(selectedOrder.createdAt).toLocaleString("en-GB")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-950">
                    <User size={18} />
                    <h3 className="font-bold">Customer</h3>
                  </div>

                  <p className="mt-4 text-lg font-bold text-stone-950">
                    {selectedOrder.customerInfo?.fullName}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-stone-600">
                    <Phone size={16} />
                    {selectedOrder.customerInfo?.phone}
                  </p>

                  <p className="mt-2 text-sm text-stone-500">
                    {selectedOrder.user?.email || "Old order / no user"}
                  </p>
                </div>

                <div className="rounded-3xl bg-stone-50 p-5">
                  <div className="flex items-center gap-3 text-stone-950">
                    <MapPin size={18} />
                    <h3 className="font-bold">Address</h3>
                  </div>

                  <p className="mt-4 text-lg font-bold text-stone-950">
                    {selectedOrder.customerInfo?.wilaya},{" "}
                    {selectedOrder.customerInfo?.commune}
                  </p>

                  <p className="mt-2 leading-7 text-stone-600">
                    {selectedOrder.customerInfo?.address}
                  </p>
                </div>
              </div>

              {selectedOrder.customerInfo?.note && (
                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-700">
                    Customer note
                  </p>

                  <p className="mt-2 text-stone-700">
                    {selectedOrder.customerInfo.note}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-stone-100 p-5">
                  <div className="flex items-center gap-2 text-stone-950">
                    <Truck size={18} />
                    <p className="font-bold">Delivery</p>
                  </div>

                  <p className="mt-3 font-bold capitalize text-stone-950">
                    {selectedOrder.deliveryMethod}
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    {formatPrice(selectedOrder.deliveryPrice)}
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-100 p-5">
                  <div className="flex items-center gap-2 text-stone-950">
                    <CreditCard size={18} />
                    <p className="font-bold">Payment</p>
                  </div>

                  <p className="mt-3 font-bold text-stone-950">
                    {formatPaymentMethod(selectedOrder.paymentMethod)}
                  </p>

                  <select
                    value={selectedOrder.paymentStatus || "unpaid"}
                    disabled={updatingId === selectedOrder._id}
                    onChange={(e) =>
                      updateOrder(selectedOrder._id, {
                        paymentStatus: e.target.value,
                      })
                    }
                    className={`mt-3 w-full rounded-2xl px-3 py-3 text-sm font-semibold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      paymentStyles[selectedOrder.paymentStatus] ||
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-3xl border border-stone-100 p-5">
                  <div className="flex items-center gap-2 text-stone-950">
                    <Receipt size={18} />
                    <p className="font-bold">Order status</p>
                  </div>

                  <select
                    value={selectedOrder.orderStatus}
                    disabled={updatingId === selectedOrder._id}
                    onChange={(e) =>
                      updateOrder(selectedOrder._id, {
                        orderStatus: e.target.value,
                      })
                    }
                    className={`mt-3 w-full rounded-2xl px-3 py-3 text-sm font-semibold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      statusStyles[selectedOrder.orderStatus] ||
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedOrder.paymentMethod === "baridimob" &&
                selectedOrder.paymentStatus === "pending" && (
                  <div className="rounded-3xl bg-amber-50 p-5">
                    <p className="font-bold text-amber-700">
                      BaridiMob payment pending
                    </p>

                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      After checking the transfer receipt, use the workflow
                      action below to mark payment as{" "}
                      <span className="font-bold">paid</span> and confirm the
                      order.
                    </p>
                  </div>
                )}

              <div className="rounded-3xl bg-green-50 p-5">
                <p className="font-bold text-green-700">Admin workflow</p>

                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {selectedWorkflow.help ||
                    "Confirm the order and prepare a WhatsApp message."}
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => handleWorkflowConfirm(selectedOrder)}
                    disabled={
                      selectedWorkflow.disabled ||
                      workflowUpdatingId === selectedOrder._id
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    <MessageCircle size={17} />
                    {workflowUpdatingId === selectedOrder._id
                      ? "Processing..."
                      : selectedWorkflow.label}
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openWhatsAppForOrder(selectedOrder)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <MessageCircle size={17} />
                      WhatsApp only
                    </button>

                    <Link
                      to={`/invoice/${selectedOrder._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <FileText size={17} />
                      Open invoice
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-stone-950">Products</h3>

                {selectedOrder.orderItems?.map((item) => {
                  const price = Number(item.price || 0);
                  const oldPrice = Number(item.oldPrice || 0);
                  const quantity = Number(item.quantity || 1);
                  const discountPercent = Number(item.discountPercent || 0);
                  const hasDiscount = oldPrice > price && discountPercent > 0;
                  const lineTotal = price * quantity;

                  return (
                    <div
                      key={`${selectedOrder._id}-${item.product}`}
                      className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {hasDiscount && (
                          <span className="absolute left-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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

                        <p className="text-sm text-stone-500">
                          Qty: {quantity} × {formatPrice(price)}
                        </p>

                        {hasDiscount && (
                          <p className="text-xs text-stone-400">
                            Old price:{" "}
                            <span className="line-through">
                              {formatPrice(oldPrice)}
                            </span>
                          </p>
                        )}
                      </div>

                      <p className="whitespace-nowrap text-sm font-bold text-stone-950">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-stone-950 p-5 text-white">
                {selectedOrderSavings > 0 && (
                  <div className="flex justify-between gap-4 text-sm text-white/60">
                    <span>Before discount</span>

                    <span className="whitespace-nowrap line-through">
                      {formatPrice(selectedSubtotalBeforeDiscount)}
                    </span>
                  </div>
                )}

                {selectedOrderSavings > 0 && (
                  <div className="mt-3 flex justify-between gap-4 text-sm text-red-200">
                    <span>You save</span>

                    <span className="whitespace-nowrap">
                      -{formatPrice(selectedOrderSavings)}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-between gap-4 text-sm text-stone-300">
                  <span>Subtotal</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(selectedOrder.subtotalPrice)}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 text-sm text-stone-300">
                  <span>Delivery</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(selectedOrder.deliveryPrice)}
                  </span>
                </div>

                <div className="mt-4 flex justify-between gap-4 border-t border-white/10 pt-4 text-lg font-bold">
                  <span>Total</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default AdminOrders;
