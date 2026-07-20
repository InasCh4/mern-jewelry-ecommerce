const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["rings", "necklaces", "bracelets", "earrings", "watches"],
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    material: {
      type: String,
      default: "Gold plated",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
