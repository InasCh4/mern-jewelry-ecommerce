const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

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
      required: [true, "Password is required"],
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
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
