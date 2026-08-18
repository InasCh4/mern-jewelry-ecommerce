const mongoose = require("mongoose");

const orderStatusValues = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const paymentStatusValues = ["unpaid", "pending", "paid", "failed"];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    oldPrice: {
      type: Number,
      default: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "order_created",
        "payment_proof_uploaded",
        "payment_status_updated",
        "order_status_updated",
        "order_cancelled",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    orderStatus: {
      type: String,
      enum: orderStatusValues,
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: paymentStatusValues,
      default: "unpaid",
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    changedBy: {
      type: String,
      enum: ["system", "customer", "admin"],
      default: "system",
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerInfo: {
      fullName: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      wilaya: {
        type: String,
        required: true,
      },

      wilayaCode: {
        type: String,
        default: "",
      },

      commune: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },

      note: {
        type: String,
        default: "",
      },
    },

    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (items) => items.length > 0,
        "Order must contain at least one item",
      ],
    },

    subtotalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    deliveryPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "baridimob", "card"],
      default: "cash",
    },

    paymentProof: {
      imageUrl: {
        type: String,
        default: "",
        trim: true,
      },

      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    deliveryMethod: {
      type: String,
      enum: ["home", "office"],
      default: "home",
    },

    orderStatus: {
      type: String,
      enum: orderStatusValues,
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: paymentStatusValues,
      default: "unpaid",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
