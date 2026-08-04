const Product = require("../models/Product");

// GET all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET one product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST create product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
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

    const numericPrice = Number(price);
    const numericOldPrice = Number(oldPrice || 0);
    const numericStock = Number(stock || 0);

    if (numericPrice <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0.",
      });
    }

    if (numericOldPrice < 0) {
      return res.status(400).json({
        message: "Old price cannot be negative.",
      });
    }

    if (numericStock < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      oldPrice: numericOldPrice,
      category,
      images,
      stock: numericStock,
      material,
      isFeatured,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// PUT update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (req.body.price !== undefined) {
      const numericPrice = Number(req.body.price);

      if (numericPrice <= 0) {
        return res.status(400).json({
          message: "Price must be greater than 0.",
        });
      }

      product.price = numericPrice;
    }

    if (req.body.oldPrice !== undefined) {
      const numericOldPrice = Number(req.body.oldPrice || 0);

      if (numericOldPrice < 0) {
        return res.status(400).json({
          message: "Old price cannot be negative.",
        });
      }

      product.oldPrice = numericOldPrice;
    }

    if (req.body.stock !== undefined) {
      const numericStock = Number(req.body.stock || 0);

      if (numericStock < 0) {
        return res.status(400).json({
          message: "Stock cannot be negative.",
        });
      }

      product.stock = numericStock;
    }

    product.name = req.body.name?.trim() ?? product.name;
    product.description = req.body.description?.trim() ?? product.description;
    product.category = req.body.category ?? product.category;
    product.images = req.body.images ?? product.images;
    product.material = req.body.material ?? product.material;
    product.isFeatured = req.body.isFeatured ?? product.isFeatured;

    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// POST create review
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment?.trim()) {
      return res.status(400).json({
        message: "Please add a rating and comment.",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You already reviewed this product.",
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    const updatedProduct = await product.save();

    res.status(201).json({
      message: "Review added successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
};
