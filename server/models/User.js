const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (email) => validator.isEmail(email),
        message: "Please enter a valid email address",
      },
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: [25, "Phone number cannot exceed 25 characters"],
    },

    defaultAddress: {
      wilaya: {
        type: String,
        default: "",
        trim: true,
        maxlength: [80, "Wilaya cannot exceed 80 characters"],
      },

      commune: {
        type: String,
        default: "",
        trim: true,
        maxlength: [80, "Commune cannot exceed 80 characters"],
      },

      address: {
        type: String,
        default: "",
        trim: true,
        maxlength: [180, "Address cannot exceed 180 characters"],
      },
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCodeHash: {
      type: String,
      select: false,
      default: undefined,
    },

    emailVerificationExpires: {
      type: Date,
      default: undefined,
    },

    emailVerificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    lastVerificationEmailSentAt: {
      type: Date,
      default: undefined,
    },

    passwordResetTokenHash: {
      type: String,
      select: false,
      default: undefined,
    },

    passwordResetExpires: {
      type: Date,
      default: undefined,
    },

    passwordChangedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;

  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) return false;

  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

  return jwtIssuedAt < changedTimestamp;
};

userSchema.methods.createEmailVerificationCode = function () {
  const code = String(crypto.randomInt(100000, 999999));

  this.emailVerificationCodeHash = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  this.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  this.emailVerificationAttempts = 0;
  this.lastVerificationEmailSentAt = new Date();

  return code;
};

userSchema.methods.clearEmailVerificationCode = function () {
  this.emailVerificationCodeHash = undefined;
  this.emailVerificationExpires = undefined;
  this.emailVerificationAttempts = 0;
  this.lastVerificationEmailSentAt = undefined;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};

userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetTokenHash = undefined;
  this.passwordResetExpires = undefined;
};

module.exports = mongoose.model("User", userSchema);
