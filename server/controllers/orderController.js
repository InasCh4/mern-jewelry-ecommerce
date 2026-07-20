const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const {
      customerInfo,
      orderItems,
      paymentMethod,
      deliveryMethod,
      deliveryPrice = 0,
    } = req.body;

    if (!customerInfo) {
      return res
        .status(400)
        .json({ message: "Customer information is required" });
    }

    const { fullName, phone, wilaya, commune, address } = customerInfo;

    if (!fullName || !phone || !wilaya || !commune || !address) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const productIds = orderItems.map((item) => item.product);

    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== orderItems.length) {
      return res.status(400).json({ message: "Some products were not found" });
    }

    const safeOrderItems = [];

    for (const item of orderItems) {
      const product = products.find((p) => p._id.toString() === item.product);

      const quantity = Number(item.quantity);

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `${product.name} has only ${product.stock} items in stock`,
        });
      }

      safeOrderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity,
      });
    }

    const subtotalPrice = safeOrderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const finalDeliveryPrice = Number(deliveryPrice);
    const totalPrice = subtotalPrice + finalDeliveryPrice;

    const order = await Order.create({
      customerInfo,
      orderItems: safeOrderItems,
      subtotalPrice,
      deliveryPrice: finalDeliveryPrice,
      totalPrice,
      paymentMethod,
      deliveryMethod,
      paymentStatus: paymentMethod === "cash" ? "unpaid" : "pending",
    });

    // Reduce product stock after order creation
    for (const item of safeOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "orderItems.product",
      "name price images",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
};
