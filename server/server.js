const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const deliveryRateRoutes = require("./routes/deliveryRateRoutes");
const siteSettingRoutes = require("./routes/siteSettingRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentSettingRoutes = require("./routes/paymentSettingRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const {
  sanitizeRequest,
  globalLimiter,
  authLimiter,
  orderLimiter,
  uploadLimiter,
} = require("./middleware/securityMiddleware");

dotenv.config();

connectDB();

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Local uploads only in development.
// In production, receipts/images should use Cloudinary or another secure storage.
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static("uploads"));
}

app.use(hpp());
app.use(sanitizeRequest);
app.use(globalLimiter);

app.use("/api/products", productRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/delivery-rates", deliveryRateRoutes);
app.use("/api/site-settings", siteSettingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment-settings", paymentSettingRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("API is running 💎");
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong."
        : error.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
