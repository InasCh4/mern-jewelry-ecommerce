const DeliveryRate = require("../models/DeliveryRate");
const wilayas = require("../data/wilayas.json");

const normalizeCode = (code) => String(code || "").padStart(2, "0");

const getField = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }

  return "";
};

const normalizedWilayas = wilayas
  .map((wilaya) => {
    const wilayaCode = normalizeCode(
      getField(wilaya, ["code", "id", "wilaya_code", "code_wilaya"]),
    );

    const wilayaName = getField(wilaya, [
      "name",
      "name_fr",
      "wilaya_name",
      "wilaya_name_fr",
      "nom",
      "nom_fr",
    ]);

    return {
      wilayaCode,
      wilayaName,
    };
  })
  .filter((wilaya) => wilaya.wilayaCode && wilaya.wilayaName)
  .sort((a, b) => Number(a.wilayaCode) - Number(b.wilayaCode));

const PRICE_GROUPS = [
  {
    codes: ["16"],
    homePrice: 400,
    officePrice: 250,
  },
  {
    codes: ["09", "10", "26", "35", "42", "44"],
    homePrice: 500,
    officePrice: 350,
  },
  {
    codes: [
      "02",
      "06",
      "13",
      "15",
      "18",
      "19",
      "21",
      "23",
      "24",
      "25",
      "27",
      "31",
      "34",
      "36",
      "41",
      "43",
      "46",
      "48",
    ],
    homePrice: 600,
    officePrice: 400,
  },
  {
    codes: [
      "03",
      "04",
      "05",
      "14",
      "17",
      "20",
      "22",
      "28",
      "29",
      "32",
      "38",
      "40",
      "45",
      "51",
      "57",
      "58",
      "59",
      "60",
      "61",
      "63",
      "64",
      "65",
      "66",
      "67",
      "68",
      "69",
    ],
    homePrice: 700,
    officePrice: 500,
  },
  {
    codes: ["07", "30", "39", "47", "49", "52", "55", "62"],
    homePrice: 900,
    officePrice: 650,
  },
  {
    codes: ["01", "08", "11", "12", "33", "37", "50", "53", "54", "56"],
    homePrice: 1200,
    officePrice: 800,
  },
];

const getDefaultPrices = (wilayaCode) => {
  const group = PRICE_GROUPS.find((priceGroup) =>
    priceGroup.codes.includes(wilayaCode),
  );

  return {
    homePrice: group?.homePrice || 700,
    officePrice: group?.officePrice || 500,
  };
};

const getDefaultDeliveryRates = () => {
  return normalizedWilayas.map((wilaya) => {
    const prices = getDefaultPrices(wilaya.wilayaCode);

    return {
      wilayaCode: wilaya.wilayaCode,
      wilayaName: wilaya.wilayaName,
      homePrice: prices.homePrice,
      officePrice: prices.officePrice,
      isActive: true,
    };
  });
};

const ensureDeliveryRates = async () => {
  const defaultDeliveryRates = getDefaultDeliveryRates();
  const existingCodes = await DeliveryRate.distinct("wilayaCode");

  const missingRates = defaultDeliveryRates.filter(
    (rate) => !existingCodes.includes(rate.wilayaCode),
  );

  if (missingRates.length > 0) {
    await DeliveryRate.insertMany(missingRates);
  }

  return DeliveryRate.find().sort({ wilayaCode: 1 });
};

const getDeliveryRates = async (req, res) => {
  try {
    const rates = await ensureDeliveryRates();

    res.status(200).json(rates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDeliveryPrice = async (req, res) => {
  try {
    await ensureDeliveryRates();

    const wilayaCode = normalizeCode(req.query.wilayaCode);
    const method = req.query.method === "office" ? "office" : "home";

    if (!wilayaCode) {
      return res.status(400).json({
        message: "Wilaya code is required.",
      });
    }

    const rate = await DeliveryRate.findOne({
      wilayaCode,
      isActive: true,
    });

    if (!rate) {
      return res.status(404).json({
        message: "Delivery price is not configured for this wilaya.",
      });
    }

    const deliveryPrice =
      method === "office" ? rate.officePrice : rate.homePrice;

    res.status(200).json({
      wilayaCode: rate.wilayaCode,
      wilayaName: rate.wilayaName,
      method,
      deliveryPrice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDeliveryRate = async (req, res) => {
  try {
    const { homePrice, officePrice, isActive } = req.body;

    const rate = await DeliveryRate.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        message: "Delivery rate not found.",
      });
    }

    if (homePrice !== undefined) {
      const numericHomePrice = Number(homePrice);

      if (numericHomePrice < 0) {
        return res.status(400).json({
          message: "Home delivery price cannot be negative.",
        });
      }

      rate.homePrice = numericHomePrice;
    }

    if (officePrice !== undefined) {
      const numericOfficePrice = Number(officePrice);

      if (numericOfficePrice < 0) {
        return res.status(400).json({
          message: "Office delivery price cannot be negative.",
        });
      }

      rate.officePrice = numericOfficePrice;
    }

    if (isActive !== undefined) {
      rate.isActive = Boolean(isActive);
    }

    const updatedRate = await rate.save();

    res.status(200).json(updatedRate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetDeliveryRatesToDefault = async (req, res) => {
  try {
    const defaultDeliveryRates = getDefaultDeliveryRates();

    await DeliveryRate.deleteMany({});
    await DeliveryRate.insertMany(defaultDeliveryRates);

    const rates = await DeliveryRate.find().sort({ wilayaCode: 1 });

    res.status(200).json({
      message: "Delivery rates reset successfully.",
      rates,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDeliveryRates,
  getDeliveryPrice,
  updateDeliveryRate,
  resetDeliveryRatesToDefault,
  ensureDeliveryRates,
};
