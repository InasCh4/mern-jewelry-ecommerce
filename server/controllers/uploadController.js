const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "eclora/products",
    });

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadImage,
};
