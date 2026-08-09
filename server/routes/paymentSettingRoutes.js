const express = require("express");
const {
  getPaymentSettings,
  updatePaymentSettings,
  resetPaymentSettings,
} = require("../controllers/paymentSettingController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getPaymentSettings);
router.put("/", protect, admin, updatePaymentSettings);
router.post("/reset", protect, admin, resetPaymentSettings);

module.exports = router;
