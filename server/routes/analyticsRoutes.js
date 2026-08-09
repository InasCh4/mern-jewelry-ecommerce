const express = require("express");
const { getAdminAnalytics } = require("../controllers/analyticsController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", protect, admin, getAdminAnalytics);

module.exports = router;
