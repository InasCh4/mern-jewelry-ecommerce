const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getLastSixMonths = () => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      revenue: 0,
      orders: 0,
    });
  }

  return months;
};

// GET /api/analytics/admin
// Private admin
const getAdminAnalytics = async (req, res) => {
  try {
    const [
      orders,
      productsCount,
      customersCount,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      Order.find().lean(),
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.find({ stock: { $lte: 5 } })
        .select("name stock price images category")
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const validOrders = orders.filter(
      (order) => order.orderStatus !== "cancelled",
    );

    const totalRevenue = validOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice || 0),
      0,
    );

    const paidRevenue = validOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "pending",
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.orderStatus === "delivered",
    ).length;
    const cancelledOrders = orders.filter(
      (order) => order.orderStatus === "cancelled",
    ).length;

    const averageOrderValue =
      validOrders.length > 0
        ? Math.round(totalRevenue / validOrders.length)
        : 0;

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (statusCounts[order.orderStatus] !== undefined) {
        statusCounts[order.orderStatus] += 1;
      }
    });

    const lastSixMonths = getLastSixMonths();

    validOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthEntry = lastSixMonths.find(
        (entry) => entry.year === year && entry.month === month,
      );

      if (monthEntry) {
        monthEntry.revenue += Number(order.totalPrice || 0);
        monthEntry.orders += 1;
      }
    });

    const productMap = {};

    validOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const productId = String(item.product);

        if (!productMap[productId]) {
          productMap[productId] = {
            product: productId,
            name: item.name,
            image: item.image,
            quantity: 0,
            revenue: 0,
          };
        }

        productMap[productId].quantity += Number(item.quantity || 0);
        productMap[productId].revenue +=
          Number(item.price || 0) * Number(item.quantity || 0);
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    res.status(200).json({
      cards: {
        totalRevenue,
        paidRevenue,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        customersCount,
        productsCount,
        lowStockCount: lowStockProducts.length,
        averageOrderValue,
      },
      statusCounts,
      monthlyRevenue: lastSixMonths,
      topProducts,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAdminAnalytics,
};
