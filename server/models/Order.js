const mongoose = require("mongoose");

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
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
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

    orderItems: [orderItemSchema],

    subtotalPrice: {
      type: Number,
      required: true,
    },

    deliveryPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "baridimob", "card"],
      default: "cash",
    },

    deliveryMethod: {
      type: String,
      enum: ["home", "office"],
      default: "home",
    },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
