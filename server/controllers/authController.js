const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const { stripHtml } = require("../middleware/securityMiddleware");
const { sendEmail } = require("../utils/emailService");

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const cleanText = (value, maxLength = 120) => {
  return stripHtml(value).slice(0, maxLength).trim();
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
};

const isEmailVerificationRequired = () => {
  return process.env.REQUIRE_EMAIL_VERIFICATION === "true";
};

const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return "";
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
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    token: generateToken(user._id),
  });
};

const sendVerificationEmail = async (user) => {
  const code = user.createEmailVerificationCode();

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: "Verify your ECLORA email",
    text: `Your ECLORA verification code is: ${code}. This code expires in 15 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1c1917">
        <h2>Verify your ECLORA email</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your ECLORA password",
    text: `Reset your ECLORA password using this link: ${resetUrl}. This link expires in 15 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1c1917">
        <h2>Reset your ECLORA password</h2>
        <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#1c1917;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">
          Reset password
        </a>
        <p style="margin-top:20px;font-size:13px;color:#78716c">If you did not request this, ignore this email.</p>
      </div>
    `,
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

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists.",
      });
    }

    const user = new User({
      name,
      email,
      password,
      authProvider: "local",
      isEmailVerified: false,
    });

    await user.save();

    await sendVerificationEmail(user);

    return res.status(201).json({
      message: "Account created. Please verify your email.",
      email: user.email,
      needsEmailVerification: true,
    });
  } catch (error) {
    return res.status(500).json({
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

    if (!user || user.authProvider !== "local") {
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

    if (isEmailVerificationRequired() && !user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before login.",
        email: user.email,
        needsEmailVerification: true,
      });
    }

    return sendUserResponse(res, 200, user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").replace(/\D/g, "");

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (code.length !== 6) {
      return res.status(400).json({
        message: "Verification code must contain 6 digits.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationCodeHash",
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    if (user.isEmailVerified) {
      return sendUserResponse(res, 200, user);
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    if (user.emailVerificationAttempts >= 5) {
      return res.status(429).json({
        message: "Too many invalid attempts. Please request a new code.",
      });
    }

    const codeHash = hashToken(code);

    if (codeHash !== user.emailVerificationCodeHash) {
      user.emailVerificationAttempts += 1;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    user.isEmailVerified = true;
    user.clearEmailVerificationCode();

    await user.save({ validateBeforeSave: false });

    return sendUserResponse(res, 200, user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/auth/resend-verification
const resendVerificationCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "If this account exists, a verification code has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email is already verified.",
      });
    }

    if (
      user.lastVerificationEmailSentAt &&
      Date.now() - user.lastVerificationEmailSentAt.getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        message: "Please wait before requesting another code.",
      });
    }

    await sendVerificationEmail(user);

    return res.status(200).json({
      message: "Verification code sent.",
      email: user.email,
      needsEmailVerification: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const genericResponse = {
      message: "If this email exists, a password reset link has been sent.",
    };

    const user = await User.findOne({ email });

    if (!user || user.authProvider !== "local") {
      return res.status(200).json(genericResponse);
    }

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user, resetToken);

    return res.status(200).json(genericResponse);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// PATCH /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const resetToken = String(req.params.token || "");
    const password = String(req.body.password || "");

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    const resetTokenHash = hashToken(resetToken);

    const user = await User.findOne({
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetTokenHash +password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    user.password = password;
    user.isEmailVerified = true;
    user.clearPasswordResetToken();

    await user.save();

    return sendUserResponse(res, 200, user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone || "",
    defaultAddress: req.user.defaultAddress || {
      wilaya: "",
      commune: "",
      address: "",
    },
    role: req.user.role,
    authProvider: req.user.authProvider,
    isEmailVerified: req.user.isEmailVerified,
  });
};

// PUT /api/auth/profile
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
      user.isEmailVerified = false;

      await sendVerificationEmail(user);
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

    return sendUserResponse(res, 200, updatedUser);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    const passwordError = validatePasswordStrength(newPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || user.authProvider !== "local") {
      return res.status(400).json({
        message: "Password change is not available for this account.",
      });
    }

    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;

    await user.save();

    return sendUserResponse(res, 200, user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
