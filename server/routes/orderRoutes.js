const express = require("express");
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  uploadPaymentProof,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/", protect, admin, getOrders);

router.get("/:id", protect, getOrderById);

router.patch("/:id/payment-proof", protect, uploadPaymentProof);

router.patch("/:id/cancel", protect, cancelOrder);

router.patch("/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
