import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import api from "../api/axios";

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} DA`;

const paymentLabels = {
  cash: "Cash on delivery",
  baridimob: "BaridiMob",
  card: "Card payment",
};

const formatPaymentMethod = (method) => paymentLabels[method] || method;

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

const Invoice = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({
    shopName: "ECLORA",
    logoUrl: "",
    contact: {
      phone: "",
      email: "",
      address: "",
      whatsapp: "",
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);

        const [orderRes, settingsRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get("/site-settings"),
        ]);

        setOrder(orderRes.data);

        setSettings({
          shopName: settingsRes.data.shopName || "ECLORA",
          logoUrl: settingsRes.data.logoUrl || "",
          contact: {
            phone: settingsRes.data.contact?.phone || "",
            email: settingsRes.data.contact?.email || "",
            address: settingsRes.data.contact?.address || "",
            whatsapp: settingsRes.data.contact?.whatsapp || "",
          },
        });
      } catch (error) {
        console.log("Could not load invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  const totalSavings = useMemo(() => getOrderSavings(order), [order]);

  const subtotalBeforeDiscount =
    Number(order?.subtotalPrice || 0) + totalSavings;

  const shopName = settings.shopName || "ECLORA";
  const invoiceNumber = order?._id
    ? `INV-${order._id.slice(-8).toUpperCase()}`
    : "INV";

  const orderNumber = order?._id ? `#${order._id.slice(-6).toUpperCase()}` : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading invoice...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-950">
            Invoice not found
          </h1>

          <p className="mt-3 text-stone-500">
            This invoice does not exist or you cannot access it.
          </p>

          <Link
            to="/my-orders"
            className="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-white"
          >
            Back to my orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 9mm;
            }

            html,
            body,
            #root {
              background: #ffffff !important;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .invoice-page {
              padding: 0 !important;
              background: #ffffff !important;
            }

            .invoice-sheet {
              width: 100% !important;
              max-width: none !important;
              min-height: auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }

            .invoice-no-print {
              display: none !important;
            }

            .invoice-avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .invoice-table th,
            .invoice-table td {
              padding-top: 7px !important;
              padding-bottom: 7px !important;
            }
          }
        `}
      </style>

      <main className="invoice-page min-h-screen bg-stone-100 px-4 py-6 print:bg-white">
        <div className="invoice-no-print mx-auto mb-5 flex max-w-4xl items-center justify-between gap-4">
          <Link
            to={`/my-orders/${order._id}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 transition hover:border-stone-950"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            <Printer size={17} />
            Print / Save PDF
          </button>
        </div>

        <section className="invoice-sheet mx-auto max-w-4xl bg-white p-8 shadow-sm">
          <div className="invoice-avoid-break flex items-start justify-between gap-6 border-b border-stone-200 pb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={shopName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-950 text-base font-black text-white">
                    {shopName.charAt(0)}
                  </div>
                )}

                <div>
                  <h1 className="text-3xl font-black tracking-[0.12em] text-stone-950">
                    {shopName}
                  </h1>

                  <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                    Invoice
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs leading-5 text-stone-500">
                {settings.contact.phone && (
                  <p>Phone: {settings.contact.phone}</p>
                )}

                {settings.contact.email && (
                  <p>Email: {settings.contact.email}</p>
                )}

                {settings.contact.address && (
                  <p>Address: {settings.contact.address}</p>
                )}
              </div>
            </div>

            <div className="w-64 shrink-0 rounded-2xl bg-stone-50 p-4 text-xs">
              <div className="grid gap-3">
                <div>
                  <p className="text-stone-500">Invoice number</p>
                  <p className="mt-0.5 font-bold text-stone-950">
                    {invoiceNumber}
                  </p>
                </div>

                <div>
                  <p className="text-stone-500">Order number</p>
                  <p className="mt-0.5 font-bold text-stone-950">
                    {orderNumber}
                  </p>
                </div>

                <div>
                  <p className="text-stone-500">Date</p>
                  <p className="mt-0.5 font-bold text-stone-950">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-avoid-break grid gap-6 border-b border-stone-200 py-5 md:grid-cols-2">
            <div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-stone-400">
                Bill to
              </h2>

              <p className="mt-3 text-base font-bold text-stone-950">
                {order.customerInfo?.fullName}
              </p>

              <p className="mt-1 text-sm text-stone-600">
                {order.customerInfo?.phone}
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-600">
                {order.customerInfo?.address}
              </p>

              <p className="mt-1 text-sm text-stone-500">
                {order.customerInfo?.commune}, {order.customerInfo?.wilaya}
              </p>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-stone-400">
                Order info
              </h2>

              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex justify-between gap-4 rounded-xl bg-stone-50 px-3 py-2">
                  <span className="text-stone-500">Order status</span>
                  <span className="font-bold capitalize text-stone-950">
                    {order.orderStatus}
                  </span>
                </div>

                <div className="flex justify-between gap-4 rounded-xl bg-stone-50 px-3 py-2">
                  <span className="text-stone-500">Payment</span>
                  <span className="font-bold capitalize text-stone-950">
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 rounded-xl bg-stone-50 px-3 py-2">
                  <span className="text-stone-500">Payment status</span>
                  <span className="font-bold capitalize text-stone-950">
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-between gap-4 rounded-xl bg-stone-50 px-3 py-2">
                  <span className="text-stone-500">Delivery</span>
                  <span className="font-bold capitalize text-stone-950">
                    {order.deliveryMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="py-5">
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-stone-400">
              Items
            </h2>

            <div className="overflow-hidden rounded-2xl border border-stone-200">
              <table className="invoice-table w-full border-collapse text-xs">
                <thead className="bg-stone-50 text-left text-stone-500">
                  <tr>
                    <th className="p-3 font-medium">Product</th>
                    <th className="w-16 p-3 text-center font-medium">Qty</th>
                    <th className="w-28 p-3 text-right font-medium">Price</th>
                    <th className="w-28 p-3 text-right font-medium">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {order.orderItems?.map((item) => {
                    const price = Number(item.price || 0);
                    const oldPrice = Number(item.oldPrice || 0);
                    const quantity = Number(item.quantity || 1);
                    const discountPercent = Number(item.discountPercent || 0);
                    const hasDiscount = oldPrice > price && discountPercent > 0;

                    return (
                      <tr
                        key={`${order._id}-${item.product}`}
                        className="border-t border-stone-100"
                      >
                        <td className="p-3">
                          <p className="font-semibold text-stone-950">
                            {item.name}
                          </p>

                          {hasDiscount && (
                            <p className="mt-0.5 text-[11px] text-red-500">
                              Discount: -{discountPercent}% | Old price:{" "}
                              {formatPrice(oldPrice)}
                            </p>
                          )}
                        </td>

                        <td className="p-3 text-center text-stone-600">
                          {quantity}
                        </td>

                        <td className="p-3 text-right text-stone-600">
                          {formatPrice(price)}
                        </td>

                        <td className="p-3 text-right font-semibold text-stone-950">
                          {formatPrice(price * quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-avoid-break ml-auto max-w-xs space-y-2 border-t border-stone-200 pt-4 text-sm">
            {totalSavings > 0 && (
              <div className="flex justify-between gap-4 text-stone-500">
                <span>Before discount</span>
                <span className="line-through">
                  {formatPrice(subtotalBeforeDiscount)}
                </span>
              </div>
            )}

            {totalSavings > 0 && (
              <div className="flex justify-between gap-4 text-red-600">
                <span>You save</span>
                <span>-{formatPrice(totalSavings)}</span>
              </div>
            )}

            <div className="flex justify-between gap-4 text-stone-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotalPrice)}</span>
            </div>

            <div className="flex justify-between gap-4 text-stone-600">
              <span>Delivery</span>
              <span>{formatPrice(order.deliveryPrice)}</span>
            </div>

            <div className="flex justify-between gap-4 border-t border-stone-200 pt-3 text-xl font-black text-stone-950">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>

          {order.customerInfo?.note && (
            <div className="invoice-avoid-break mt-5 rounded-2xl bg-amber-50 p-3 text-xs text-stone-700">
              <span className="font-bold text-amber-700">Customer note:</span>{" "}
              {order.customerInfo.note}
            </div>
          )}

          <div className="invoice-avoid-break mt-6 border-t border-stone-200 pt-4 text-center text-xs text-stone-400">
            <p>Thank you for shopping with {shopName}.</p>
            <p className="mt-0.5">Keep this invoice for your records.</p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Invoice;
