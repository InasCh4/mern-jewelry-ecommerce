const PaymentSetting = require("../models/PaymentSetting");
const { stripHtml } = require("../middleware/securityMiddleware");

const cleanText = (value, maxLength = 300) => {
  return stripHtml(value).slice(0, maxLength).trim();
};

const getDefaultPaymentSettings = () => ({
  cash: {
    isActive: true,
    displayName: "Cash on delivery",
    description: "Pay when your order arrives.",
    instructions:
      "The customer pays the full order amount directly to the delivery agent.",
    accountName: "",
    accountNumber: "",
  },

  baridimob: {
    isActive: false,
    displayName: "BaridiMob",
    description: "Pay using BaridiMob transfer.",
    instructions:
      "After placing the order, send the transfer receipt through WhatsApp.",
    accountName: "",
    accountNumber: "",
  },

  card: {
    isActive: false,
    displayName: "Card payment",
    description: "Online card payment will be available soon.",
    instructions: "Card payment provider is not connected yet.",
    accountName: "",
    accountNumber: "",
  },

  paymentNotice:
    "Your order will be confirmed after payment verification when required.",
});

const ensurePaymentSettings = async () => {
  let settings = await PaymentSetting.findOne();

  if (!settings) {
    settings = await PaymentSetting.create(getDefaultPaymentSettings());
  }

  return settings;
};

const cleanMethod = (method, fallback) => ({
  isActive: Boolean(method?.isActive),
  displayName: cleanText(method?.displayName, 80) || fallback.displayName,
  description: cleanText(method?.description, 300),
  instructions: cleanText(method?.instructions, 600),
  accountName: cleanText(method?.accountName, 120),
  accountNumber: cleanText(method?.accountNumber, 80),
});

// GET /api/payment-settings
// Public
const getPaymentSettings = async (req, res) => {
  try {
    const settings = await ensurePaymentSettings();

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PUT /api/payment-settings
// Private admin
const updatePaymentSettings = async (req, res) => {
  try {
    const settings = await ensurePaymentSettings();
    const defaults = getDefaultPaymentSettings();

    const body = req.body || {};

    if (body.cash) {
      settings.cash = cleanMethod(body.cash, defaults.cash);
    }

    if (body.baridimob) {
      settings.baridimob = cleanMethod(body.baridimob, defaults.baridimob);
    }

    if (body.card) {
      settings.card = cleanMethod(body.card, defaults.card);
    }

    if (body.paymentNotice !== undefined) {
      settings.paymentNotice = cleanText(body.paymentNotice, 400);
    }

    if (
      !settings.cash.isActive &&
      !settings.baridimob.isActive &&
      !settings.card.isActive
    ) {
      return res.status(400).json({
        message: "At least one payment method must be active.",
      });
    }

    const updatedSettings = await settings.save();

    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST /api/payment-settings/reset
// Private admin
const resetPaymentSettings = async (req, res) => {
  try {
    await PaymentSetting.deleteMany({});

    const settings = await PaymentSetting.create(getDefaultPaymentSettings());

    res.status(200).json({
      message: "Payment settings reset successfully.",
      settings,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  resetPaymentSettings,
  ensurePaymentSettings,
};
