import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  ImagePlus,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  Upload,
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

const paymentStatusStyles = {
  unpaid: "bg-stone-100 text-stone-600",
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
};

const defaultPaymentSettings = {
  cash: {
    isActive: true,
    displayName: "Cash on delivery",
    description: "Pay when your order arrives.",
    instructions:
      "The customer pays the full order amount directly to the delivery agent.",
    accountName: "",
    accountNumber: "",
  },
  baridimob: {
    isActive: false,
    displayName: "BaridiMob",
    description: "Pay using BaridiMob transfer.",
    instructions:
      "After placing the order, send the transfer receipt through WhatsApp.",
    accountName: "",
    accountNumber: "",
  },
  card: {
    isActive: false,
    displayName: "Card payment",
    description: "Online card payment will be available soon.",
    instructions: "Card payment provider is not connected yet.",
    accountName: "",
    accountNumber: "",
  },
  paymentNotice:
    "Your order will be confirmed after payment verification when required.",
};

const defaultSiteSettings = {
  shopName: "ECLORA",
  contact: {
    phone: "",
    email: "",
    whatsapp: "",
  },
};

const timelineSteps = ["pending", "confirmed", "shipped", "delivered"];

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} DA`;

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

const buildReceiptMessage = (order) => {
  const orderNumber = `#${order._id.slice(-6).toUpperCase()}`;
  const customerName = order.customerInfo?.fullName || "";

  return `Bonjour,

Voici mon reçu BaridiMob pour la commande ${orderNumber}.

Nom : ${customerName}
Total : ${formatPrice(order.totalPrice)}
Paiement : BaridiMob
Statut paiement : en attente de vérification

Je joins le reçu de paiement ici.

Merci.`;
};

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(
    defaultPaymentSettings,
  );
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const [orderRes, paymentRes, siteSettingsRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get("/payment-settings"),
        api.get("/site-settings"),
      ]);

      setOrder(orderRes.data);

      setPaymentSettings({
        ...defaultPaymentSettings,
        ...paymentRes.data,
        cash: {
          ...defaultPaymentSettings.cash,
          ...paymentRes.data.cash,
        },
        baridimob: {
          ...defaultPaymentSettings.baridimob,
          ...paymentRes.data.baridimob,
        },
        card: {
          ...defaultPaymentSettings.card,
          ...paymentRes.data.card,
        },
      });

      setSiteSettings({
        ...defaultSiteSettings,
        ...siteSettingsRes.data,
        contact: {
          ...defaultSiteSettings.contact,
          ...siteSettingsRes.data.contact,
        },
      });
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

  const selectedPaymentMethod = order?.paymentMethod
    ? paymentSettings[order.paymentMethod]
    : null;

  const shopContact = siteSettings.contact || {};
  const shopWhatsAppPhone = shopContact.whatsapp || "";
  const normalizedWhatsAppPhone =
    normalizeDzPhoneForWhatsApp(shopWhatsAppPhone);

  const shouldShowBaridiMobReceiptHelp =
    order?.paymentMethod === "baridimob" && order?.paymentStatus === "pending";

  const hasAlternativeContact = Boolean(shopContact.phone || shopContact.email);
  const hasPaymentProof = Boolean(order?.paymentProof?.imageUrl);

  const uploadImage = async (file) => {
    if (!file) return "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return "";
    }

    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !order) return;

    const toastId = toast.loading("Uploading payment proof...");

    try {
      setUploadingProof(true);

      const imageUrl = await uploadImage(file);

      if (!imageUrl) {
        toast.dismiss(toastId);
        return;
      }

      const res = await api.patch(`/orders/${order._id}/payment-proof`, {
        paymentProofUrl: imageUrl,
      });

      setOrder(res.data);

      toast.success("Payment proof uploaded successfully.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not upload payment proof.",
        {
          id: toastId,
        },
      );
    } finally {
      setUploadingProof(false);
      e.target.value = "";
    }
  };

  const openReceiptWhatsApp = () => {
    const phone = normalizeDzPhoneForWhatsApp(shopWhatsAppPhone);

    if (!phone) {
      toast.error("WhatsApp number is not configured by the shop.");
      return;
    }

    if (!order) {
      toast.error("Order is not loaded yet.");
      return;
    }

    const message = buildReceiptMessage(order);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

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

          <div className="flex flex-wrap gap-3">
            <Link
              to="/my-orders"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              <ArrowLeft size={16} />
              Back to my orders
            </Link>

            <Link
              to={`/invoice/${order._id}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              <FileText size={16} />
              Invoice
            </Link>
          </div>
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

                      <p className="whitespace-nowrap font-bold text-stone-950">
                        {formatPrice(lineTotal)}
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
                      {formatPrice(subtotalBeforeDiscount)}
                    </span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 text-red-600">
                    <span className="min-w-0">You save</span>

                    <span className="whitespace-nowrap text-right">
                      -{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <span className="min-w-0">Subtotal</span>

                  <span className="whitespace-nowrap text-right">
                    {formatPrice(order.subtotalPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <span className="min-w-0">Delivery</span>

                  <span className="whitespace-nowrap text-right">
                    {formatPrice(order.deliveryPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-stone-100 pt-4 text-xl font-bold text-stone-950">
                  <span className="min-w-0">Total</span>

                  <span className="whitespace-nowrap text-right">
                    {formatPrice(order.totalPrice)}
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

                  <p className="font-bold">
                    {selectedPaymentMethod?.displayName || order.paymentMethod}
                  </p>
                </div>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    paymentStatusStyles[order.paymentStatus] ||
                    "bg-stone-100 text-stone-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {selectedPaymentMethod?.description && (
                <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                  {selectedPaymentMethod.description}
                </p>
              )}

              {selectedPaymentMethod?.instructions && (
                <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-stone-700">
                  {selectedPaymentMethod.instructions}
                </p>
              )}

              {order.paymentMethod === "baridimob" &&
                (selectedPaymentMethod?.accountName ||
                  selectedPaymentMethod?.accountNumber) && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
                    {selectedPaymentMethod.accountName && (
                      <p>
                        <span className="font-semibold text-stone-950">
                          Account:
                        </span>{" "}
                        {selectedPaymentMethod.accountName}
                      </p>
                    )}

                    {selectedPaymentMethod.accountNumber && (
                      <p>
                        <span className="font-semibold text-stone-950">
                          RIP / Number:
                        </span>{" "}
                        {selectedPaymentMethod.accountNumber}
                      </p>
                    )}
                  </div>
                )}

              {shouldShowBaridiMobReceiptHelp && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-700">
                    BaridiMob receipt
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    After making the transfer, upload your receipt in the
                    website or send it through WhatsApp so the shop can verify
                    your payment.
                  </p>

                  {hasPaymentProof ? (
                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-50 text-green-600">
                          <ImagePlus size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-green-700">
                            Payment proof uploaded
                          </p>

                          <p className="mt-1 text-sm text-stone-600">
                            Your receipt has been sent to the shop for
                            verification.
                          </p>

                          <a
                            href={order.paymentProof.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <ExternalLink size={15} />
                            View uploaded receipt
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
                      <Upload size={17} />
                      {uploadingProof
                        ? "Uploading receipt..."
                        : "Upload receipt in website"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofUpload}
                        disabled={uploadingProof}
                        className="hidden"
                      />
                    </label>
                  )}

                  {normalizedWhatsAppPhone ? (
                    <button
                      type="button"
                      onClick={openReceiptWhatsApp}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <MessageCircle size={17} />
                      Send receipt on WhatsApp
                    </button>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">
                      WhatsApp is not configured yet by the shop.
                    </p>
                  )}

                  {hasAlternativeContact && (
                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-sm font-semibold text-stone-950">
                        Don’t use WhatsApp?
                      </p>

                      <p className="mt-1 text-sm text-stone-600">
                        You can contact the shop using the details below.
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-stone-700">
                        {shopContact.phone && (
                          <a
                            href={`tel:${shopContact.phone}`}
                            className="flex items-center gap-2 break-all rounded-xl bg-stone-50 px-3 py-2 transition hover:text-stone-950"
                          >
                            <Phone size={15} />
                            {shopContact.phone}
                          </a>
                        )}

                        {shopContact.email && (
                          <a
                            href={`mailto:${shopContact.email}`}
                            className="flex items-center gap-2 break-all rounded-xl bg-stone-50 px-3 py-2 transition hover:text-stone-950"
                          >
                            <Mail size={15} />
                            {shopContact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentSettings.paymentNotice && (
                <p className="mt-4 text-xs leading-6 text-stone-500">
                  {paymentSettings.paymentNotice}
                </p>
              )}
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
