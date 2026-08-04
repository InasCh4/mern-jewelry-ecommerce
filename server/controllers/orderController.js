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
      const productId = item._id || item.product;
      const quantity = Number(item.quantity || 0);

      if (!productId) {
        return res.status(400).json({
          message: "Product id is missing.",
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

    const finalDeliveryPrice = Number(deliveryPrice || 0);
    const totalPrice = subtotalPrice + finalDeliveryPrice;

    const order = await Order.create({
      user: req.user._id,

      customerInfo: {
        fullName: customerInfo.fullName?.trim(),
        phone: customerInfo.phone?.trim(),
        wilaya: customerInfo.wilaya,
        commune: customerInfo.commune,
        address: customerInfo.address?.trim(),
        note: customerInfo.note?.trim() || "",
      },

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

    await order.save();

    const populatedOrder = await Order.findById(order._id).populate(
      "user",
      "name email role",
    );

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

    const cancelledOrder = await order.save();

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    const populatedOrder = await Order.findById(cancelledOrder._id).populate(
      "user",
      "name email role",
    );

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
  updateOrderStatus,
  cancelOrder,
};
