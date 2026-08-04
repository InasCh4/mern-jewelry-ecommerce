const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const { stripHtml } = require("../middleware/securityMiddleware");

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const cleanText = (value, maxLength = 120) => {
  return stripHtml(value).slice(0, maxLength).trim();
};

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

const sendUserResponse = (res, statusCode, user) => {
  res.status(statusCode).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    defaultAddress: user.defaultAddress || {
      wilaya: "",
      commune: "",
      address: "",
    },
    role: user.role,
    token: generateToken(user._id),
  });
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const name = cleanText(req.body.name, 60);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    sendUserResponse(res, 201, user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    sendUserResponse(res, 200, user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// PUT /api/auth/profile
// Private
const updateProfile = async (req, res) => {
  try {
    const name =
      req.body.name !== undefined ? cleanText(req.body.name, 60) : "";
    const email =
      req.body.email !== undefined ? normalizeEmail(req.body.email) : "";
    const phone =
      req.body.phone !== undefined ? cleanText(req.body.phone, 25) : "";
    const defaultAddress = req.body.defaultAddress;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          message: "Please enter a valid email address.",
        });
      }

      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already used by another account.",
        });
      }

      user.email = email;
    }

    if (req.body.name !== undefined) {
      if (!name || name.length < 2) {
        return res.status(400).json({
          message: "Name must be at least 2 characters.",
        });
      }

      user.name = name;
    }

    if (req.body.phone !== undefined) {
      if (phone && !validator.isMobilePhone(phone, "any")) {
        return res.status(400).json({
          message: "Please enter a valid phone number.",
        });
      }

      user.phone = phone;
    }

    if (defaultAddress) {
      user.defaultAddress = {
        wilaya: cleanText(defaultAddress.wilaya, 80),
        commune: cleanText(defaultAddress.commune, 80),
        address: cleanText(defaultAddress.address, 180),
      };
    }

    const updatedUser = await user.save();

    sendUserResponse(res, 200, updatedUser);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
