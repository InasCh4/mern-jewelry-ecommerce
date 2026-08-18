const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const removeLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const hasCloudinaryConfig = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const getUploadErrorMessage = (error) => {
  return (
    error?.message ||
    error?.error?.message ||
    error?.error?.error?.message ||
    "Could not upload image."
  );
};

const uploadWithRetry = async (filePath, options, retries = 2) => {
  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await cloudinary.uploader.upload(filePath, {
        ...options,
        resource_type: "image",
        timeout: 120000,
      });
    } catch (error) {
      lastError = error;

      const message = getUploadErrorMessage(error);
      console.error(`Cloudinary upload attempt ${attempt} failed:`, message);

      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError;
};

const uploadToCloudinary = async (req, res, folder) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided.",
      });
    }

    if (!hasCloudinaryConfig()) {
      removeLocalFile(req.file.path);

      return res.status(500).json({
        message: "Cloudinary env variables are missing.",
      });
    }

    const result = await uploadWithRetry(req.file.path, {
      folder,
    });

    removeLocalFile(req.file.path);

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    removeLocalFile(req.file?.path);

    const message = getUploadErrorMessage(error);

    console.error("Cloudinary upload final error:", {
      message,
      name: error?.name || error?.error?.name || error?.error?.error?.name,
      http_code:
        error?.http_code ||
        error?.error?.http_code ||
        error?.error?.error?.http_code,
    });

    return res.status(500).json({
      message,
    });
  }
};

const uploadProductImage = async (req, res) => {
  return uploadToCloudinary(req, res, "eclora/products");
};

const uploadPaymentProofImage = async (req, res) => {
  return uploadToCloudinary(req, res, "eclora/payment-proofs");
};

module.exports = {
  uploadProductImage,
  uploadPaymentProofImage,
};
