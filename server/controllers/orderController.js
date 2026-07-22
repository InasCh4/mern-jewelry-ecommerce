const Order = require("../models/Order");
const Product = require("../models/Product");

// POST /api/orders
// Private user
const createOrder = async (req, res) => {
  try {
    const {
      customerInfo,
      orderItems,
      deliveryPrice,
      paymentMethod,
      deliveryMethod,
    } = req.body;

    if (!customerInfo || !orderItems || orderItems.length === 0) {
      return res.status(400).json({
        message: "Order data is missing",
      });
    }

    let subtotalPrice = 0;
    const safeOrderItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item._id || item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.name}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      subtotalPrice += product.price * item.quantity;

      safeOrderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0],
        price: product.price,
        quantity: item.quantity,
      });
    }

    const finalDeliveryPrice = Number(deliveryPrice || 0);
    const totalPrice = subtotalPrice + finalDeliveryPrice;

    const order = await Order.create({
      user: req.user._id,
      customerInfo,
      orderItems: safeOrderItems,
      subtotalPrice,
      deliveryPrice: finalDeliveryPrice,
      totalPrice,
      paymentMethod,
      deliveryMethod,
    });

    for (const item of safeOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json(order);
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
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email role",
    );

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

// PATCH /api/orders/:id/status
// Private admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
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
  updateOrderStatus,
};
