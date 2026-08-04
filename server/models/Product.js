const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

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
      min: 0,
    },

    oldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
      min: 0,
    },

    material: {
      type: String,
      default: "Gold plated",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    reviews: [reviewSchema],

    rating: {
      type: Number,
      required: true,
      default: 0,
    },

    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre("save", function () {
  if (this.oldPrice && this.oldPrice > this.price) {
    const discount = ((this.oldPrice - this.price) / this.oldPrice) * 100;
    this.discountPercent = Math.round(discount);
  } else {
    this.oldPrice = 0;
    this.discountPercent = 0;
  }
});

module.exports = mongoose.model("Product", productSchema);
