import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
  Eye,
  X,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import api from "../api/axios";

const statusOptions = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const getStatusClass = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-50 text-blue-600";
    case "shipped":
      return "bg-amber-50 text-amber-600";
    case "delivered":
      return "bg-green-50 text-green-600";
    case "cancelled":
      return "bg-red-50 text-red-600";
    default:
      return "bg-stone-100 text-stone-600";
  }
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, orderStatus) => {
    try {
      setUpdatingId(orderId);

      const res = await api.patch(`/orders/${orderId}/status`, {
        orderStatus,
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? res.data : order)),
      );

      setSelectedOrder((prevOrder) =>
        prevOrder?._id === orderId ? res.data : prevOrder,
      );
    } catch (error) {
      console.log("Error updating order:", error);
      alert(error.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalRevenue = orders.reduce(
    (total, order) =>
      order.orderStatus !== "cancelled" ? total + order.totalPrice : total,
    0,
  );

  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending",
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "delivered",
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "cancelled",
  ).length;

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <>
      <main className="bg-stone-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Dashboard
            </h1>

            <p className="mt-3 text-stone-500">
              Manage orders, delivery status, and customer requests.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-stone-100">
                <ShoppingBag size={22} />
              </div>

              <p className="mt-5 text-sm text-stone-500">Total Orders</p>

              <h2 className="mt-1 text-3xl font-bold text-stone-950">
                {orders.length}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600">
                <Truck size={22} />
              </div>

              <p className="mt-5 text-sm text-stone-500">Pending</p>

              <h2 className="mt-1 text-3xl font-bold text-stone-950">
                {pendingOrders}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-600">
                <PackageCheck size={22} />
              </div>

              <p className="mt-5 text-sm text-stone-500">Delivered</p>

              <h2 className="mt-1 text-3xl font-bold text-stone-950">
                {deliveredOrders}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
                <XCircle size={22} />
              </div>

              <p className="mt-5 text-sm text-stone-500">Cancelled</p>

              <h2 className="mt-1 text-3xl font-bold text-stone-950">
                {cancelledOrders}
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">Orders</h2>

                <p className="mt-1 text-stone-500">
                  Total revenue:{" "}
                  <span className="font-semibold text-stone-950">
                    {totalRevenue} DA
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/admin/products"
                  className="w-fit rounded-full bg-stone-950 px-5 py-2 text-sm text-white transition hover:bg-stone-700"
                >
                  Manage Products
                </Link>

                <button
                  onClick={fetchOrders}
                  className="w-fit rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Refresh
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <p className="py-10 text-center text-stone-500">No orders yet.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="text-left text-sm text-stone-400">
                      <th className="py-4 font-medium">Order</th>
                      <th className="py-4 font-medium">Customer</th>
                      <th className="py-4 font-medium">Location</th>
                      <th className="py-4 font-medium">Items</th>
                      <th className="py-4 font-medium">Total</th>
                      <th className="py-4 font-medium">Payment</th>
                      <th className="py-4 font-medium">Status</th>
                      <th className="py-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-stone-100 text-sm"
                      >
                        <td className="py-5 pr-4">
                          <p className="max-w-[160px] truncate font-semibold text-stone-950">
                            {order._id}
                          </p>

                          <p className="mt-1 text-xs text-stone-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </td>

                        <td className="py-5 pr-4">
                          <p className="font-semibold text-stone-950">
                            {order.customerInfo?.fullName}
                          </p>

                          <p className="mt-1 text-stone-500">
                            {order.customerInfo?.phone}
                          </p>
                        </td>

                        <td className="py-5 pr-4">
                          <p className="font-medium text-stone-950">
                            {order.customerInfo?.wilaya}
                          </p>

                          <p className="mt-1 text-stone-500">
                            {order.customerInfo?.commune}
                          </p>
                        </td>

                        <td className="py-5 pr-4">
                          <div className="space-y-2">
                            {order.orderItems?.map((item) => (
                              <div
                                key={`${order._id}-${item.product}`}
                                className="flex items-center gap-3"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-xl object-cover"
                                />

                                <div>
                                  <p className="max-w-[200px] truncate font-medium text-stone-950">
                                    {item.name}
                                  </p>

                                  <p className="text-xs text-stone-500">
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-5 pr-4 font-bold text-stone-950">
                          {order.totalPrice} DA
                        </td>

                        <td className="py-5 pr-4">
                          <p className="font-medium capitalize text-stone-950">
                            {order.paymentMethod}
                          </p>

                          <p className="mt-1 text-xs capitalize text-stone-500">
                            {order.paymentStatus}
                          </p>
                        </td>

                        <td className="py-5 pr-4">
                          <div className="flex flex-col gap-3">
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                order.orderStatus,
                              )}`}
                            >
                              {order.orderStatus}
                            </span>

                            <select
                              value={order.orderStatus}
                              disabled={updatingId === order._id}
                              onChange={(e) =>
                                updateStatus(order._id, e.target.value)
                              }
                              className="w-36 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm capitalize text-stone-700 outline-none transition focus:border-stone-900 disabled:opacity-60"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td className="py-5 pr-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white"
                          >
                            <Eye size={15} />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 h-full w-full"
            aria-label="Close order details"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-100 bg-white/95 p-6 backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.4em] text-stone-400">
                  Order Details
                </p>

                <h2 className="mt-2 max-w-md truncate text-2xl font-bold text-stone-950">
                  #{selectedOrder._id}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
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
                  <p className="text-sm text-stone-500">Delivery</p>

                  <p className="mt-2 font-bold capitalize text-stone-950">
                    {selectedOrder.deliveryMethod}
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-100 p-5">
                  <p className="text-sm text-stone-500">Payment</p>

                  <p className="mt-2 font-bold capitalize text-stone-950">
                    {selectedOrder.paymentMethod}
                  </p>

                  <p className="mt-1 text-sm capitalize text-stone-500">
                    {selectedOrder.paymentStatus}
                  </p>
                </div>

                <div className="rounded-3xl border border-stone-100 p-5">
                  <p className="text-sm text-stone-500">Status</p>

                  <select
                    value={selectedOrder.orderStatus}
                    disabled={updatingId === selectedOrder._id}
                    onChange={(e) =>
                      updateStatus(selectedOrder._id, e.target.value)
                    }
                    className="mt-3 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-stone-900 disabled:opacity-60"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-[2rem] bg-stone-50 p-5">
                <h3 className="text-lg font-bold text-stone-950">Products</h3>

                <div className="mt-4 space-y-3">
                  {selectedOrder.orderItems?.map((item) => (
                    <div
                      key={`${selectedOrder._id}-${item.product}`}
                      className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-stone-950">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                          {item.quantity} × {item.price} DA
                        </p>
                      </div>

                      <p className="font-bold text-stone-950">
                        {item.quantity * item.price} DA
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-stone-950 p-6 text-white">
                <div className="flex justify-between text-white/80">
                  <span>Subtotal</span>
                  <span>{selectedOrder.subtotalPrice} DA</span>
                </div>

                <div className="mt-3 flex justify-between text-white/60">
                  <span>Delivery</span>
                  <span>{selectedOrder.deliveryPrice} DA</span>
                </div>

                <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-2xl font-bold">
                  <span>Total</span>
                  <span>{selectedOrder.totalPrice} DA</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
