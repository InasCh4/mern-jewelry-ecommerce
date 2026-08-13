import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Package,
  RefreshCcw,
  Settings,
  ShoppingBag,
  Truck,
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

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await api.get("/analytics/admin");
      setAnalytics(res.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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
        <p className="text-center text-stone-500">Loading dashboard...</p>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-stone-950">
            Could not load dashboard
          </h1>

          <p className="mt-3 text-stone-500">
            Please refresh or check the backend server.
          </p>

          <button
            type="button"
            onClick={fetchDashboard}
            className="mt-6 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
          >
            Try again
          </button>
        </div>
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
      link: "/admin/analytics",
    },
    {
      label: "Orders",
      value: cards.totalOrders || 0,
      sub: `${cards.pendingOrders || 0} pending orders`,
      icon: ShoppingBag,
      link: "/admin/orders",
    },
    {
      label: "Customers",
      value: cards.customersCount || 0,
      sub: "Registered customers",
      icon: Users,
      link: "/admin/customers",
    },
    {
      label: "Low stock",
      value: cards.lowStockCount || 0,
      sub: "Products need attention",
      icon: AlertTriangle,
      link: "/admin/products",
    },
  ];

  const quickActions = [
    {
      label: "Manage Products",
      description: "Add, edit, stock, prices and sale offers.",
      path: "/admin/products",
      icon: Package,
    },
    {
      label: "Manage Orders",
      description: "Confirm orders and update delivery status.",
      path: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      label: "Delivery Prices",
      description: "Control wilaya delivery prices.",
      path: "/admin/delivery-rates",
      icon: Truck,
    },
    {
      label: "Site Settings",
      description: "Logo, hero, footer, socials and homepage content.",
      path: "/admin/site-settings",
      icon: Settings,
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
              Dashboard
            </h1>

            <p className="mt-3 text-stone-500">
              Your store cockpit: orders, revenue, stock alerts and quick
              actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>

            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Full analytics
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {mainCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                to={card.link}
                className="group rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-950 text-white">
                    <Icon size={21} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-stone-300 transition group-hover:translate-x-1 group-hover:text-stone-950"
                  />
                </div>

                <p className="mt-5 text-sm text-stone-500">{card.label}</p>

                <h2 className="mt-2 text-3xl font-bold text-stone-950">
                  {card.value}
                </h2>

                <p className="mt-2 text-sm text-stone-400">{card.sub}</p>
              </Link>
            );
          })}
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Revenue pulse
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Last 6 months overview.
                </p>
              </div>

              <BarChart3 size={24} className="text-stone-300" />
            </div>

            <div className="flex h-64 items-end gap-4 overflow-x-auto rounded-3xl bg-stone-50 p-5">
              {analytics.monthlyRevenue?.map((month) => {
                const height = Math.max(
                  8,
                  (Number(month.revenue || 0) / maxMonthlyRevenue) * 185,
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
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Order status
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Current order distribution.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
              >
                View
              </Link>
            </div>

            <div className="space-y-3">
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

        <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Quick actions
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Jump into the important panels.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="group rounded-3xl border border-stone-100 bg-stone-50 p-5 transition hover:border-stone-950 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-950 shadow-sm">
                        <Icon size={20} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-stone-300 transition group-hover:translate-x-1 group-hover:text-stone-950"
                      />
                    </div>

                    <h3 className="mt-5 font-bold text-stone-950">
                      {action.label}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {action.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Recent orders
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Latest customer activity.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
              >
                All orders
              </Link>
            </div>

            {analytics.recentOrders?.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col gap-3 rounded-3xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-stone-950">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>

                      <p className="mt-1 truncate text-sm text-stone-500">
                        {order.user?.name ||
                          order.customerInfo?.fullName ||
                          "Customer"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusStyles[order.orderStatus] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {order.orderStatus}
                      </span>

                      <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-950">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-stone-50 p-5 text-stone-500">
                No recent orders yet.
              </p>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Top products
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Best sellers by quantity.
                </p>
              </div>

              <Link
                to="/admin/analytics"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
              >
                More
              </Link>
            </div>

            {analytics.topProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.slice(0, 4).map((product) => (
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
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Stock alerts
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Products with 5 items or less.
                </p>
              </div>

              <Link
                to="/admin/products"
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
              >
                Products
              </Link>
            </div>

            {analytics.lowStockProducts?.length > 0 ? (
              <div className="space-y-4">
                {analytics.lowStockProducts.slice(0, 4).map((product) => (
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
      </div>
    </main>
  );
};

export default AdminDashboard;
