const mongoose = require("mongoose");

const deliveryRateSchema = new mongoose.Schema(
  {
    wilayaCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    wilayaName: {
      type: String,
      required: true,
      trim: true,
    },

    homePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    officePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DeliveryRate", deliveryRateSchema);
