const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found.",
      });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        message: "Password was changed recently. Please login again.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed.",
    });
  }
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized.",
    });
  }

  if (
    process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
    !req.user.isEmailVerified
  ) {
    return res.status(403).json({
      message: "Please verify your email first.",
      needsEmailVerification: true,
    });
  }

  return next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Not authorized as admin.",
  });
};

module.exports = {
  protect,
  requireVerifiedEmail,
  admin,
};
