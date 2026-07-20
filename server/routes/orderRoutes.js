const express = require("express");
const {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
