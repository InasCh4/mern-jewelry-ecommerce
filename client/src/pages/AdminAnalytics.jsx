import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Box,
  CircleDollarSign,
  Package,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const statusStyles = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  shipped: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

const formatPrice = (value) => `${Number(value || 0).toLocaleString()} DA`;

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const res = await api.get("/analytics/admin");
      setAnalytics(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxMonthlyRevenue = useMemo(() => {
    if (!analytics?.monthlyRevenue?.length) return 1;

    return Math.max(
      ...analytics.monthlyRevenue.map((month) => Number(month.revenue || 0)),
      1,
    );
  }, [analytics]);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading analytics...</p>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-red-500">Could not load analytics.</p>
      </main>
    );
  }

  const cards = analytics.cards || {};

  const mainCards = [
    {
      label: "Revenue",
      value: formatPrice(cards.totalRevenue),
      sub: "Excluding cancelled orders",
      icon: CircleDollarSign,
    },
    {
      label: "Orders",
      value: cards.totalOrders || 0,
      sub: `${cards.pendingOrders || 0} pending`,
      icon: ShoppingBag,
    },
    {
      label: "Customers",
      value: cards.customersCount || 0,
      sub: "Registered customer accounts",
      icon: Users,
    },
    {
      label: "Average order",
      value: formatPrice(cards.averageOrderValue),
      sub: "Average valid order value",
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Analytics
            </h1>

            <p className="mt-3 text-stone-500">
              Track sales, orders, stock alerts, and product performance.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {mainCards.map((card) => {
            const Icon = card.icon;

            return (
              <section
                key={card.label}
                className="rounded-[2rem] bg-white p-6 shadow-sm"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-950 text-white">
                  <Icon size={21} />
                </div>

                <p className="mt-5 text-sm text-stone-500">{card.label}</p>

                <h2 className="mt-2 text-3xl font-bold text-stone-950">
                  {card.value}
                </h2>

                <p className="mt-2 text-sm text-stone-400">{card.sub}</p>
              </section>
            );
          })}
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Revenue overview
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Last 6 months revenue.
                </p>
              </div>

              <BarChart3 size={24} className="text-stone-300" />
            </div>

            <div className="flex h-72 items-end gap-4 overflow-x-auto rounded-3xl bg-stone-50 p-5">
              {analytics.monthlyRevenue?.map((month) => {
                const height = Math.max(
                  8,
                  (Number(month.revenue || 0) / maxMonthlyRevenue) * 210,
                );

                return (
                  <div
                    key={month.label}
                    className="flex min-w-20 flex-1 flex-col items-center justify-end gap-3"
                  >
                    <p className="text-xs font-semibold text-stone-500">
                      {formatPrice(month.revenue)}
                    </p>

                    <div
                      className="w-full rounded-t-2xl bg-stone-950 transition-all"
                      style={{ height: `${height}px` }}
                    />

                    <div className="text-center">
                      <p className="text-xs font-semibold text-stone-700">
                        {month.label}
                      </p>

                      <p className="text-[11px] text-stone-400">
                        {month.orders} orders
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-950">Order status</h2>

            <div className="mt-6 space-y-3">
              {Object.entries(analytics.statusCounts || {}).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-stone-50 p-4"
                  >
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        statusStyles[status] || "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {status}
                    </span>

                    <span className="font-bold text-stone-950">{count}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Package size={23} className="text-stone-700" />

              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Top products
                </h2>

                <p className="text-sm text-stone-500">
                  Best sellers by quantity.
                </p>
              </div>
            </div>

            {analytics.topProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.map((product) => (
                  <div
                    key={product.product}
                    className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-stone-950">
                        {product.name}
                      </p>

                      <p className="mt-1 text-sm text-stone-500">
                        Sold: {product.quantity}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-bold text-stone-950">
                      {formatPrice(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-stone-50 p-5 text-stone-500">
                No sales data yet.
              </p>
            )}
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle size={23} className="text-amber-500" />

              <div>
                <h2 className="text-2xl font-bold text-stone-950">Low stock</h2>

                <p className="text-sm text-stone-500">
                  Products with 5 items or less.
                </p>
              </div>
            </div>

            {analytics.lowStockProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-stone-950">
                        {product.name}
                      </p>

                      <p className="mt-1 text-sm text-stone-500">
                        {product.category} · {formatPrice(product.price)}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-green-50 p-5 text-green-600">
                Stock looks good.
              </p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-950">Recent orders</h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-stone-400">
                  <th className="py-4 pr-5 font-medium">Order</th>
                  <th className="py-4 pr-5 font-medium">Customer</th>
                  <th className="py-4 pr-5 font-medium">Status</th>
                  <th className="py-4 pr-5 font-medium">Payment</th>
                  <th className="py-4 text-right font-medium">Total</th>
                </tr>
              </thead>

              <tbody>
                {analytics.recentOrders?.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-4 pr-5 font-bold text-stone-950">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>

                    <td className="py-4 pr-5 text-stone-600">
                      {order.user?.name || order.customerInfo?.fullName}
                    </td>

                    <td className="py-4 pr-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusStyles[order.orderStatus] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="py-4 pr-5 text-stone-600 capitalize">
                      {order.paymentMethod} · {order.paymentStatus}
                    </td>

                    <td className="py-4 text-right font-bold text-stone-950">
                      {formatPrice(order.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!analytics.recentOrders?.length && (
              <p className="py-8 text-center text-stone-500">
                No recent orders.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminAnalytics;
