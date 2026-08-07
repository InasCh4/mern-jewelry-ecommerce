const mongoose = require("mongoose");

const heroSlideSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true },
);

const siteSettingSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: "ECLORA",
      trim: true,
      maxlength: 60,
    },

    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    announcementText: {
      type: String,
      default: "Free delivery on selected orders.",
      trim: true,
      maxlength: 140,
    },

    hero: {
      eyebrow: {
        type: String,
        default: "Jewelry for soft power moments",
        trim: true,
        maxlength: 100,
      },

      title: {
        type: String,
        default: "Elegant jewelry made to glow every day.",
        trim: true,
        maxlength: 140,
      },

      subtitle: {
        type: String,
        default:
          "Discover refined pieces designed for everyday elegance, gifting, and special little victories.",
        trim: true,
        maxlength: 260,
      },

      primaryButtonText: {
        type: String,
        default: "Shop now",
        trim: true,
        maxlength: 40,
      },

      primaryButtonLink: {
        type: String,
        default: "/#products",
        trim: true,
        maxlength: 180,
      },

      secondaryButtonText: {
        type: String,
        default: "View collections",
        trim: true,
        maxlength: 40,
      },

      secondaryButtonLink: {
        type: String,
        default: "/#collections",
        trim: true,
        maxlength: 180,
      },

      slides: {
        type: [heroSlideSchema],
        default: [],
      },
    },

    about: {
      title: {
        type: String,
        default: "About ECLORA",
        trim: true,
        maxlength: 120,
      },

      text: {
        type: String,
        default:
          "ECLORA is a modern jewelry store focused on elegant, wearable pieces with a premium shopping experience.",
        trim: true,
        maxlength: 900,
      },
    },

    contact: {
      phone: {
        type: String,
        default: "",
        trim: true,
        maxlength: 30,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        maxlength: 120,
      },

      address: {
        type: String,
        default: "",
        trim: true,
        maxlength: 180,
      },

      whatsapp: {
        type: String,
        default: "",
        trim: true,
        maxlength: 40,
      },
    },

    socials: {
      instagram: {
        type: String,
        default: "",
        trim: true,
      },

      facebook: {
        type: String,
        default: "",
        trim: true,
      },

      tiktok: {
        type: String,
        default: "",
        trim: true,
      },

      linkedin: {
        type: String,
        default: "",
        trim: true,
      },
    },

    footerText: {
      type: String,
      default: "© ECLORA. All rights reserved.",
      trim: true,
      maxlength: 180,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
