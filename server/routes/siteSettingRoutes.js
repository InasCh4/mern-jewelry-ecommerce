const express = require("express");
const {
  getSiteSettings,
  updateSiteSettings,
  resetSiteSettings,
} = require("../controllers/siteSettingController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getSiteSettings);

router.put("/", protect, admin, updateSiteSettings);
router.post("/reset", protect, admin, resetSiteSettings);

module.exports = router;
