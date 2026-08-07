const validator = require("validator");
const SiteSetting = require("../models/SiteSetting");
const { stripHtml } = require("../middleware/securityMiddleware");

const cleanText = (value, maxLength = 200) => {
  return stripHtml(value).slice(0, maxLength).trim();
};

const cleanUrl = (value, maxLength = 300) => {
  const url = cleanText(value, maxLength);

  if (!url) return "";

  const isRelativeUrl = url.startsWith("/");
  const isFullUrl = validator.isURL(url, {
    protocols: ["http", "https"],
    require_protocol: true,
  });

  if (!isRelativeUrl && !isFullUrl) {
    return "";
  }

  return url;
};

const getDefaultSettings = () => ({
  shopName: "ECLORA",
  logoUrl: "",
  announcementText: "Free delivery on selected orders.",

  hero: {
    eyebrow: "Jewelry for soft power moments",
    title: "Elegant jewelry made to glow every day.",
    subtitle:
      "Discover refined pieces designed for everyday elegance, gifting, and special little victories.",
    primaryButtonText: "Shop now",
    primaryButtonLink: "/#products",
    secondaryButtonText: "View collections",
    secondaryButtonLink: "/#collections",
    slides: [],
  },

  about: {
    title: "About ECLORA",
    text: "ECLORA is a modern jewelry store focused on elegant, wearable pieces with a premium shopping experience.",
  },

  contact: {
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
  },

  socials: {
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
  },

  footerText: "© ECLORA. All rights reserved.",
});

const ensureSiteSettings = async () => {
  let settings = await SiteSetting.findOne();

  if (!settings) {
    settings = await SiteSetting.create(getDefaultSettings());
  }

  return settings;
};

// GET /api/site-settings
// Public
const getSiteSettings = async (req, res) => {
  try {
    const settings = await ensureSiteSettings();

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/site-settings
// Private admin
const updateSiteSettings = async (req, res) => {
  try {
    const settings = await ensureSiteSettings();

    const body = req.body || {};

    if (body.shopName !== undefined) {
      settings.shopName = cleanText(body.shopName, 60) || "ECLORA";
    }

    if (body.logoUrl !== undefined) {
      settings.logoUrl = cleanUrl(body.logoUrl, 300);
    }

    if (body.announcementText !== undefined) {
      settings.announcementText = cleanText(body.announcementText, 140);
    }

    if (body.footerText !== undefined) {
      settings.footerText = cleanText(body.footerText, 180);
    }

    if (body.hero) {
      settings.hero.eyebrow = cleanText(body.hero.eyebrow, 100);
      settings.hero.title = cleanText(body.hero.title, 140);
      settings.hero.subtitle = cleanText(body.hero.subtitle, 260);
      settings.hero.primaryButtonText = cleanText(
        body.hero.primaryButtonText,
        40,
      );
      settings.hero.primaryButtonLink =
        cleanUrl(body.hero.primaryButtonLink, 180) || "/#products";
      settings.hero.secondaryButtonText = cleanText(
        body.hero.secondaryButtonText,
        40,
      );
      settings.hero.secondaryButtonLink =
        cleanUrl(body.hero.secondaryButtonLink, 180) || "/#collections";

      if (Array.isArray(body.hero.slides)) {
        settings.hero.slides = body.hero.slides
          .slice(0, 8)
          .map((slide, index) => ({
            imageUrl: cleanUrl(slide.imageUrl, 300),
            title: cleanText(slide.title, 120),
            subtitle: cleanText(slide.subtitle, 220),
            isActive: Boolean(slide.isActive),
            sortOrder: Number(slide.sortOrder || index),
          }))
          .filter((slide) => slide.imageUrl);
      }
    }

    if (body.about) {
      settings.about.title = cleanText(body.about.title, 120);
      settings.about.text = cleanText(body.about.text, 900);
    }

    if (body.contact) {
      const email = cleanText(body.contact.email, 120);

      settings.contact.phone = cleanText(body.contact.phone, 30);
      settings.contact.email =
        email && validator.isEmail(email) ? email.toLowerCase() : "";
      settings.contact.address = cleanText(body.contact.address, 180);
      settings.contact.whatsapp = cleanText(body.contact.whatsapp, 40);
    }

    if (body.socials) {
      settings.socials.instagram = cleanUrl(body.socials.instagram, 300);
      settings.socials.facebook = cleanUrl(body.socials.facebook, 300);
      settings.socials.tiktok = cleanUrl(body.socials.tiktok, 300);
      settings.socials.linkedin = cleanUrl(body.socials.linkedin, 300);
    }

    const updatedSettings = await settings.save();

    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/site-settings/reset
// Private admin
const resetSiteSettings = async (req, res) => {
  try {
    await SiteSetting.deleteMany({});

    const settings = await SiteSetting.create(getDefaultSettings());

    res.status(200).json({
      message: "Site settings reset successfully.",
      settings,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getSiteSettings,
  updateSiteSettings,
  resetSiteSettings,
  ensureSiteSettings,
};
