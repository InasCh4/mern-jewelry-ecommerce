const express = require("express");
const multer = require("multer");
const {
  uploadProductImage,
  uploadPaymentProofImage,
} = require("../controllers/uploadController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

// Admin only: product images
router.post("/", protect, admin, upload.single("image"), uploadProductImage);

// User logged in: BaridiMob receipt images
router.post(
  "/payment-proof",
  protect,
  upload.single("image"),
  uploadPaymentProofImage,
);

module.exports = router;
