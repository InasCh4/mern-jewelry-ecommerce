const Product = require("../models/Product");

// GET all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET one product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      material,
      isFeatured,
    } = req.body;

    if (!name || !description || !price || !category || !images?.length) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      images,
      stock,
      material,
      isFeatured,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
