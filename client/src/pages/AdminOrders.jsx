import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Search } from "lucide-react";
import api from "../api/axios";

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

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      setError(error.response?.data?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.orderStatus === "pending").length,
      delivered: orders.filter((order) => order.orderStatus === "delivered")
        .length,
      cancelled: orders.filter((order) => order.orderStatus === "cancelled")
        .length,
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
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query) ||
        order.orderItems?.some((item) =>
          item.name?.toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "all" || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const updateOrder = async (orderId, updateData) => {
    try {
      setUpdatingId(orderId);

      const res = await api.patch(`/orders/${orderId}/status`, updateData);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, ...res.data } : order,
        ),
      );

      setSelectedOrder((prevOrder) =>
        prevOrder?._id === orderId ? { ...prevOrder, ...res.data } : prevOrder,
      );
    } catch (error) {
      alert(error.response?.data?.message || "Could not update order.");
    } finally {
      setUpdatingId("");
    }
  };

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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">Orders</h1>

            <p className="mt-3 text-stone-500">
              Manage customer orders, delivery status, and payment status.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Total orders</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.total}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Pending</p>
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
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-950">Order List</h2>

              <p className="mt-1 text-stone-500">
                Showing {filteredOrders.length} of {orders.length} orders.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 px-11 py-3 outline-none focus:border-stone-900"
                  placeholder="Search client, phone, product..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-stone-200 px-4 py-3 capitalize outline-none focus:border-stone-900"
              >
                <option value="all">All status</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-stone-400">
                  <th className="py-4 font-medium">Order</th>
                  <th className="py-4 font-medium">Customer</th>
                  <th className="py-4 font-medium">Location</th>
                  <th className="py-4 font-medium">Total</th>
                  <th className="py-4 font-medium">Order status</th>
                  <th className="py-4 font-medium">Payment</th>
                  <th className="py-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-5 pr-4">
                      <p className="font-bold text-stone-950">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </td>

                    <td className="py-5 pr-4">
                      <p className="font-semibold text-stone-950">
                        {order.customerInfo?.fullName}
                      </p>

                      <p className="text-xs text-stone-500">
                        {order.customerInfo?.phone}
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        User: {order.user?.email || "Old order / no user"}
                      </p>
                    </td>

                    <td className="py-5 pr-4 text-stone-600">
                      <p>{order.customerInfo?.wilaya}</p>
                      <p className="text-xs text-stone-400">
                        {order.customerInfo?.commune}
                      </p>
                    </td>

                    <td className="py-5 pr-4 font-bold text-stone-950">
                      {order.totalPrice} DA
                    </td>

                    <td className="py-5 pr-4">
                      <select
                        value={order.orderStatus}
                        disabled={updatingId === order._id}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            orderStatus: e.target.value,
                          })
                        }
                        className={`rounded-full px-3 py-2 text-xs font-semibold capitalize outline-none ${
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

                    <td className="py-5 pr-4">
                      <select
                        value={order.paymentStatus}
                        disabled={updatingId === order._id}
                        onChange={(e) =>
                          updateOrder(order._id, {
                            paymentStatus: e.target.value,
                          })
                        }
                        className={`rounded-full px-3 py-2 text-xs font-semibold capitalize outline-none ${
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
                    </td>

                    <td className="py-5 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                      >
                        Details
                      </button>
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
          <aside className="ml-auto h-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">
                  Order details
                </p>

                <h2 className="mt-2 text-2xl font-bold text-stone-950">
                  #{selectedOrder._id.slice(-6).toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-600 hover:bg-stone-200"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl bg-stone-50 p-4">
                <h3 className="font-bold text-stone-950">Customer</h3>

                <p className="mt-2 text-stone-600">
                  {selectedOrder.customerInfo?.fullName}
                </p>

                <p className="text-stone-600">
                  {selectedOrder.customerInfo?.phone}
                </p>

                <p className="text-stone-500">
                  {selectedOrder.user?.email || "Old order / no user"}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <h3 className="font-bold text-stone-950">Delivery address</h3>

                <p className="mt-2 text-stone-600">
                  {selectedOrder.customerInfo?.address}
                </p>

                <p className="mt-1 text-sm text-stone-500">
                  {selectedOrder.customerInfo?.commune},{" "}
                  {selectedOrder.customerInfo?.wilaya}
                </p>

                {selectedOrder.customerInfo?.note && (
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm text-stone-500">
                    Note: {selectedOrder.customerInfo.note}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-stone-950">Products</h3>

                {selectedOrder.orderItems?.map((item) => (
                  <div
                    key={item.product}
                    className="flex items-center gap-4 rounded-2xl bg-stone-50 p-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <p className="font-semibold text-stone-950">
                        {item.name}
                      </p>

                      <p className="text-sm text-stone-500">
                        Qty: {item.quantity} × {item.price} DA
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-stone-950 p-5 text-white">
                <div className="flex justify-between text-sm text-stone-300">
                  <span>Subtotal</span>
                  <span>{selectedOrder.subtotalPrice} DA</span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-stone-300">
                  <span>Delivery</span>
                  <span>{selectedOrder.deliveryPrice} DA</span>
                </div>

                <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-bold">
                  <span>Total</span>
                  <span>{selectedOrder.totalPrice} DA</span>
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
