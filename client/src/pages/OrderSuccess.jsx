import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, PackageCheck } from "lucide-react";
import api from "../api/axios";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        console.log("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

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
          <div className="mt-8 rounded-3xl bg-stone-50 p-5 text-left md:p-6">
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
                            Qty: {quantity} × {price} DA
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
                            <span className="line-through">{oldPrice} DA</span>
                          </p>
                        )}

                        <p className="mt-2 font-semibold text-stone-950">
                          {lineTotal} DA
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
                    {subtotalBeforeDiscount} DA
                  </span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="mt-3 flex justify-between gap-4 text-red-600">
                  <span>You save</span>

                  <span className="whitespace-nowrap">-{totalSavings} DA</span>
                </div>
              )}

              <div className="mt-3 flex justify-between gap-4 text-stone-600">
                <span>Subtotal</span>

                <span className="whitespace-nowrap">
                  {order.subtotalPrice} DA
                </span>
              </div>

              <div className="mt-3 flex justify-between gap-4 text-stone-600">
                <span>Delivery</span>

                <span className="whitespace-nowrap">
                  {order.deliveryPrice} DA
                </span>
              </div>

              <div className="mt-5 flex justify-between gap-4 border-t border-stone-100 pt-5 text-xl font-bold text-stone-950">
                <span>Total</span>

                <span className="whitespace-nowrap">{order.totalPrice} DA</span>
              </div>
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
