const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/securityMiddleware");

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
