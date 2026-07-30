const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
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
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
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
// PUT /api/auth/profile
// Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, defaultAddress } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already used by another account",
        });
      }

      user.email = email;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (defaultAddress) {
      user.defaultAddress = {
        wilaya: defaultAddress.wilaya || "",
        commune: defaultAddress.commune || "",
        address: defaultAddress.address || "",
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
