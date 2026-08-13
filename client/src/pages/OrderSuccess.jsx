import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle,
  CreditCard,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

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
    whatsapp: "",
  },
};

const paymentStatusStyles = {
  unpaid: "bg-stone-100 text-stone-600",
  pending: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
};

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

const buildReceiptMessage = (order, shopName) => {
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

const OrderSuccess = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(
    defaultPaymentSettings,
  );
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderAndPayment = async () => {
      try {
        setLoading(true);

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
        console.log("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndPayment();
  }, [id]);

  const selectedPaymentMethod = order?.paymentMethod
    ? paymentSettings[order.paymentMethod]
    : null;

  const shopWhatsAppPhone = siteSettings.contact?.whatsapp || "";
  const canSendBaridiMobReceipt =
    order?.paymentMethod === "baridimob" && order?.paymentStatus === "pending";

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

    const message = buildReceiptMessage(order, siteSettings.shopName);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

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

  return (
    <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-600">
          <CheckCircle size={40} />
        </div>

        <h1 className="mt-6 text-4xl font-bold text-stone-950">
          Order placed successfully
        </h1>

        <p className="mt-3 text-stone-500">
          Your order has been received. We will contact you soon.
        </p>

        {loading && (
          <div className="mt-8 rounded-3xl bg-stone-50 p-6">
            <p className="text-stone-500">Loading order details...</p>
          </div>
        )}

        {!loading && order && (
          <div className="mt-8 space-y-6 text-left">
            <div className="rounded-3xl bg-stone-50 p-5 md:p-6">
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-stone-500">Order ID</p>

                  <p className="mt-1 break-all font-semibold text-stone-950">
                    {order._id}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold capitalize text-amber-600">
                  {order.orderStatus}
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-4 flex items-center gap-2">
                  <PackageCheck size={20} className="text-stone-700" />

                  <h2 className="text-xl font-bold text-stone-950">
                    Order items
                  </h2>
                </div>

                <div className="space-y-4">
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
                        className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"
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
                          <h3 className="truncate text-lg font-bold text-stone-950">
                            {item.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="text-sm text-stone-500">
                              Qty: {quantity} × {formatPrice(price)}
                            </p>

                            {hasDiscount && (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                Sale
                              </span>
                            )}
                          </div>

                          {hasDiscount && (
                            <p className="mt-1 text-xs text-stone-400">
                              Old price:{" "}
                              <span className="line-through">
                                {formatPrice(oldPrice)}
                              </span>
                            </p>
                          )}

                          <p className="mt-2 font-semibold text-stone-950">
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                {totalSavings > 0 && (
                  <div className="flex justify-between gap-4 text-stone-500">
                    <span>Before discount</span>

                    <span className="whitespace-nowrap line-through">
                      {formatPrice(subtotalBeforeDiscount)}
                    </span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="mt-3 flex justify-between gap-4 text-red-600">
                    <span>You save</span>

                    <span className="whitespace-nowrap">
                      -{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-between gap-4 text-stone-600">
                  <span>Subtotal</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(order.subtotalPrice)}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 text-stone-600">
                  <span>Delivery</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(order.deliveryPrice)}
                  </span>
                </div>

                <div className="mt-5 flex justify-between gap-4 border-t border-stone-100 pt-5 text-xl font-bold text-stone-950">
                  <span>Total</span>

                  <span className="whitespace-nowrap">
                    {formatPrice(order.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 md:p-6">
              <div className="flex items-center gap-3 text-stone-950">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-950">
                  <CreditCard size={19} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">Payment information</h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Please follow the instructions below if required.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-stone-500">Payment method</p>

                  <p className="mt-1 font-bold text-stone-950">
                    {selectedPaymentMethod?.displayName || order.paymentMethod}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-stone-500">Payment status</p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      paymentStatusStyles[order.paymentStatus] ||
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {selectedPaymentMethod?.description && (
                <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-stone-600">
                  {selectedPaymentMethod.description}
                </p>
              )}

              {selectedPaymentMethod?.instructions && (
                <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-stone-700">
                  {selectedPaymentMethod.instructions}
                </p>
              )}

              {order.paymentMethod === "baridimob" &&
                (selectedPaymentMethod?.accountName ||
                  selectedPaymentMethod?.accountNumber) && (
                  <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm text-stone-600 md:grid-cols-2">
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

              {canSendBaridiMobReceipt && (
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-stone-950">
                    Send your payment receipt
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    After making the BaridiMob transfer, click the button below
                    and attach your receipt screenshot in WhatsApp.
                  </p>

                  <button
                    type="button"
                    onClick={openReceiptWhatsApp}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <MessageCircle size={17} />
                    Send payment receipt on WhatsApp
                  </button>
                </div>
              )}

              {paymentSettings.paymentNotice && (
                <p className="mt-4 text-xs leading-6 text-stone-500">
                  {paymentSettings.paymentNotice}
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && !order && (
          <div className="mt-8 rounded-3xl bg-red-50 p-6">
            <p className="text-red-600">Could not load order details.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/my-orders"
            className="rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
          >
            My Orders
          </Link>

          <Link
            to="/#products"
            className="rounded-full border border-stone-300 px-7 py-3 text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Continue Shopping
          </Link>

          {order && (
            <Link
              to={`/invoice/${order._id}`}
              className="rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
            >
              Invoice
            </Link>
          )}

          <Link
            to="/"
            className="rounded-full border border-stone-300 px-7 py-3 text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccess;
