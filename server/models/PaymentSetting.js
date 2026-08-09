const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    instructions: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },

    accountName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
  },
  { _id: false },
);

const paymentSettingSchema = new mongoose.Schema(
  {
    cash: {
      type: paymentMethodSchema,
      default: {
        isActive: true,
        displayName: "Cash on delivery",
        description: "Pay when your order arrives.",
        instructions:
          "The customer pays the full order amount directly to the delivery agent.",
      },
    },

    baridimob: {
      type: paymentMethodSchema,
      default: {
        isActive: false,
        displayName: "BaridiMob",
        description: "Pay using BaridiMob transfer.",
        instructions:
          "After placing the order, send the transfer receipt through WhatsApp.",
        accountName: "",
        accountNumber: "",
      },
    },

    card: {
      type: paymentMethodSchema,
      default: {
        isActive: false,
        displayName: "Card payment",
        description: "Online card payment will be available soon.",
        instructions: "Card payment provider is not connected yet.",
      },
    },

    paymentNotice: {
      type: String,
      default:
        "Your order will be confirmed after payment verification when required.",
      trim: true,
      maxlength: 400,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PaymentSetting", paymentSettingSchema);
