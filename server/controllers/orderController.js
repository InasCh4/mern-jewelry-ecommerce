const mongoose = require("mongoose");
const validator = require("validator");
const Order = require("../models/Order");
const Product = require("../models/Product");
const DeliveryRate = require("../models/DeliveryRate");
const { ensureDeliveryRates } = require("./deliveryRateController");
const { ensurePaymentSettings } = require("./paymentSettingController");
const { stripHtml } = require("../middleware/securityMiddleware");

const allowedPaymentMethods = ["cash", "baridimob", "card"];
const allowedOrderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];
const allowedPaymentStatuses = ["unpaid", "pending", "paid", "failed"];

const cleanText = (value, maxLength = 200) => {
  return stripHtml(value).slice(0, maxLength).trim();
};

const cleanUrl = (value, maxLength = 500) => {
  const url = cleanText(value, maxLength);

  if (!url) return "";

  const isSafeUrl = validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
  });

  return isSafeUrl ? url : "";
};

const populateOrder = async (orderId) => {
  return await Order.findById(orderId).populate("user", "name email role");
};

const addHistoryEvent = (
  order,
  {
    type,
    title,
    description = "",
    orderStatus = order.orderStatus,
    paymentStatus = order.paymentStatus,
    imageUrl = "",
    changedBy = "system",
  },
) => {
  order.statusHistory.push({
    type,
    title: cleanText(title, 120),
    description: cleanText(description, 300),
    orderStatus,
    paymentStatus,
    imageUrl,
    changedBy,
    changedAt: new Date(),
  });
};

const getOrderStatusTitle = (status) => {
  const titles = {
    pending: "Order pending",
    confirmed: "Order confirmed",
    shipped: "Order shipped",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
  };

  return titles[status] || "Order updated";
};

const getPaymentStatusTitle = (status) => {
  const titles = {
    unpaid: "Payment unpaid",
    pending: "Payment pending verification",
    paid: "Payment confirmed",
    failed: "Payment failed",
  };

  return titles[status] || "Payment updated";
};

const getSafePaymentMethod = async (paymentMethod) => {
  const paymentSettings = await ensurePaymentSettings();

  const activePaymentMethods = allowedPaymentMethods.filter(
    (method) => paymentSettings[method]?.isActive,
  );

  if (activePaymentMethods.length === 0) {
    return {
      error: "No payment method is currently available.",
    };
  }

  const requestedPaymentMethod = allowedPaymentMethods.includes(paymentMethod)
    ? paymentMethod
    : activePaymentMethods[0];

  if (!paymentSettings[requestedPaymentMethod]?.isActive) {
    return {
      error: "Selected payment method is not available.",
    };
  }

  return {
    paymentMethod: requestedPaymentMethod,
  };
};

// POST /api/orders
// Private user
const createOrder = async (req, res) => {
  try {
    const { customerInfo, orderItems, paymentMethod, deliveryMethod } =
      req.body;

    if (!customerInfo || !orderItems || orderItems.length === 0) {
      return res.status(400).json({
        message: "Order data is missing",
      });
    }

    if (!customerInfo.fullName?.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (!customerInfo.phone?.trim()) {
      return res.status(400).json({
        message: "Phone number is required.",
      });
    }

    if (!customerInfo.wilaya) {
      return res.status(400).json({
        message: "Wilaya is required.",
      });
    }

    if (!customerInfo.commune) {
      return res.status(400).json({
        message: "Commune is required.",
      });
    }

    if (!customerInfo.address?.trim()) {
      return res.status(400).json({
        message: "Address is required.",
      });
    }

    const paymentResult = await getSafePaymentMethod(paymentMethod);

    if (paymentResult.error) {
      return res.status(400).json({
        message: paymentResult.error,
      });
    }

    const safePaymentMethod = paymentResult.paymentMethod;

    let subtotalPrice = 0;
    const safeOrderItems = [];

    for (const item of orderItems) {
      const productId = item._id || item.product;
      const quantity = Number(item.quantity || 0);

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          message: "Invalid product id.",
        });
      }

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be at least 1.",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.name || productId}`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      const price = Number(product.price || 0);
      const oldPrice = Number(product.oldPrice || 0);

      const discountPercent =
        oldPrice > price
          ? Number(
              product.discountPercent ||
                Math.round(((oldPrice - price) / oldPrice) * 100),
            )
          : 0;

      const safeOldPrice = oldPrice > price ? oldPrice : 0;
      const safeDiscountPercent = safeOldPrice > 0 ? discountPercent : 0;

      subtotalPrice += price * quantity;

      safeOrderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0],
        price,
        oldPrice: safeOldPrice,
        discountPercent: safeDiscountPercent,
        quantity,
      });
    }

    await ensureDeliveryRates();

    const safeDeliveryMethod = deliveryMethod === "office" ? "office" : "home";
    const rawWilayaCode = String(customerInfo.wilayaCode || "").trim();

    if (!rawWilayaCode) {
      return res.status(400).json({
        message: "Wilaya code is missing.",
      });
    }

    const safeWilayaCode = rawWilayaCode.padStart(2, "0");

    const deliveryRate = await DeliveryRate.findOne({
      wilayaCode: safeWilayaCode,
      isActive: true,
    });

    if (!deliveryRate) {
      return res.status(400).json({
        message: "Delivery price is not configured for this wilaya.",
      });
    }

    const finalDeliveryPrice =
      safeDeliveryMethod === "office"
        ? Number(deliveryRate.officePrice || 0)
        : Number(deliveryRate.homePrice || 0);

    const totalPrice = subtotalPrice + finalDeliveryPrice;

    const paymentStatus = safePaymentMethod === "cash" ? "unpaid" : "pending";

    const order = new Order({
      user: req.user._id,

      customerInfo: {
        fullName: cleanText(customerInfo.fullName, 100),
        phone: cleanText(customerInfo.phone, 30),
        wilaya: cleanText(customerInfo.wilaya, 80),
        wilayaCode: safeWilayaCode,
        commune: cleanText(customerInfo.commune, 80),
        address: cleanText(customerInfo.address, 180),
        note: cleanText(customerInfo.note || "", 300),
      },

      orderItems: safeOrderItems,
      subtotalPrice,
      deliveryPrice: finalDeliveryPrice,
      totalPrice,
      paymentMethod: safePaymentMethod,
      paymentStatus,
      deliveryMethod: safeDeliveryMethod,
      orderStatus: "pending",
    });

    addHistoryEvent(order, {
      type: "order_created",
      title: "Order created",
      description: "The order was placed successfully.",
      orderStatus: "pending",
      paymentStatus,
      changedBy: "customer",
    });

    const savedOrder = await order.save();

    for (const item of safeOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/orders
// Private admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/orders/my-orders
// Private user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/orders/:id
// Private owner or admin
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id.",
      });
    }

    const order = await populateOrder(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const isOwner = order.user?._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to view this order",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/orders/:id/payment-proof
// Private owner only
const uploadPaymentProof = async (req, res) => {
  try {
    const proofUrl = cleanUrl(req.body.paymentProofUrl || req.body.imageUrl);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id.",
      });
    }

    if (!proofUrl) {
      return res.status(400).json({
        message: "Valid payment proof image URL is required.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const isOwner = order.user?.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({
        message: "Only the order owner can upload payment proof.",
      });
    }

    if (order.paymentMethod !== "baridimob") {
      return res.status(400).json({
        message: "Payment proof upload is only available for BaridiMob orders.",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        message: "Cannot upload payment proof for a cancelled order.",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This payment has already been confirmed.",
      });
    }

    order.paymentProof = {
      imageUrl: proofUrl,
      uploadedAt: new Date(),
    };

    order.paymentStatus = "pending";

    addHistoryEvent(order, {
      type: "payment_proof_uploaded",
      title: "Payment proof uploaded",
      description: "The customer uploaded a BaridiMob receipt.",
      orderStatus: order.orderStatus,
      paymentStatus: "pending",
      imageUrl: proofUrl,
      changedBy: "customer",
    });

    await order.save();

    const populatedOrder = await populateOrder(order._id);

    res.status(200).json(populatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/orders/:id/status
// Private admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const previousOrderStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;

    if (orderStatus) {
      if (!allowedOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({
          message: "Invalid order status.",
        });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          message: "Invalid payment status.",
        });
      }

      order.paymentStatus = paymentStatus;
    }

    if (paymentStatus && paymentStatus !== previousPaymentStatus) {
      addHistoryEvent(order, {
        type: "payment_status_updated",
        title: getPaymentStatusTitle(paymentStatus),
        description: `Payment status changed from ${previousPaymentStatus} to ${paymentStatus}.`,
        orderStatus: order.orderStatus,
        paymentStatus,
        changedBy: "admin",
      });
    }

    if (orderStatus && orderStatus !== previousOrderStatus) {
      addHistoryEvent(order, {
        type: "order_status_updated",
        title: getOrderStatusTitle(orderStatus),
        description: `Order status changed from ${previousOrderStatus} to ${orderStatus}.`,
        orderStatus,
        paymentStatus: order.paymentStatus,
        changedBy: "admin",
      });
    }

    await order.save();

    const populatedOrder = await populateOrder(order._id);

    res.status(200).json(populatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/orders/:id/cancel
// Private owner or admin
const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const isOwner = order.user?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to cancel this order",
      });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        message: "Only pending orders can be cancelled",
      });
    }

    order.orderStatus = "cancelled";

    addHistoryEvent(order, {
      type: "order_cancelled",
      title: "Order cancelled",
      description: isAdmin
        ? "The order was cancelled by an admin."
        : "The order was cancelled by the customer.",
      orderStatus: "cancelled",
      paymentStatus: order.paymentStatus,
      changedBy: isAdmin ? "admin" : "customer",
    });

    const cancelledOrder = await order.save();

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    const populatedOrder = await populateOrder(cancelledOrder._id);

    res.status(200).json(populatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  uploadPaymentProof,
  updateOrderStatus,
  cancelOrder,
};
