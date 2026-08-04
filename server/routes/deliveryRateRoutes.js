const express = require("express");
const {
  getDeliveryRates,
  getDeliveryPrice,
  updateDeliveryRate,
  resetDeliveryRatesToDefault,
} = require("../controllers/deliveryRateController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getDeliveryRates);
router.get("/price", getDeliveryPrice);

router.put("/:id", protect, admin, updateDeliveryRate);
router.post("/reset", protect, admin, resetDeliveryRatesToDefault);

module.exports = router;
