import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import api from "../api/axios";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "rings",
  imageUrl: "",
  stock: "",
  material: "",
  isFeatured: false,
};

const categories = ["rings", "necklaces", "bracelets", "earrings", "watches"];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState("");

  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  const imageInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter((product) => product.stock > 0).length,
      outOfStock: products.filter((product) => product.stock <= 0).length,
      featured: products.filter((product) => product.isFeatured).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.material?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && product.stock > 0) ||
        (stockFilter === "out" && product.stock <= 0);

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && product.isFeatured) ||
        (featuredFilter === "notFeatured" && !product.isFeatured);

      return (
        matchesSearch && matchesCategory && matchesStock && matchesFeatured
      );
    });
  }, [products, searchQuery, categoryFilter, stockFilter, featuredFilter]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setError("");
    resetImageInput();
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setFeaturedFilter("all");
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "rings",
      imageUrl: product.images?.[0] || "",
      stock: product.stock || "",
      material: product.material || "",
      isFeatured: product.isFeatured || false,
    });

    resetImageInput();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      resetImageInput();
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      setError("");

      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prevForm) => ({
        ...prevForm,
        imageUrl: res.data.url,
      }));
    } catch (error) {
      setError(error.response?.data?.message || "Image upload failed.");
      resetImageInput();
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm((prevForm) => ({
      ...prevForm,
      imageUrl: "",
    }));

    resetImageInput();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.description || !form.price || !form.imageUrl) {
      setError("Please fill all required fields.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      images: [form.imageUrl],
      stock: Number(form.stock || 0),
      material: form.material.trim(),
      isFeatured: form.isFeatured,
    };

    try {
      setSaving(true);

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      resetForm();
      await fetchProducts();
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeaturedToggle = async (product) => {
    try {
      setUpdatingFeaturedId(product._id);

      const res = await api.put(`/products/${product._id}`, {
        isFeatured: !product.isFeatured,
      });

      setProducts((prevProducts) =>
        prevProducts.map((item) =>
          item._id === product._id ? res.data : item,
        ),
      );

      if (editingProduct?._id === product._id) {
        setEditingProduct(res.data);
        setForm((prevForm) => ({
          ...prevForm,
          isFeatured: res.data.isFeatured,
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not update featured.");
    } finally {
      setUpdatingFeaturedId("");
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = confirm("Delete this product?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${productId}`);

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== productId),
      );

      if (editingProduct?._id === productId) {
        resetForm();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not delete product.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading products...</p>
      </main>
    );
  }

  return (
    <main className="bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">Products</h1>

            <p className="mt-3 text-stone-500">
              Add, edit, delete products and manage stock.
            </p>
          </div>

          <Link
            to="/admin"
            className="w-fit rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Total products</p>
            <h2 className="mt-2 text-3xl font-bold text-stone-950">
              {stats.total}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">In stock</p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {stats.inStock}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Out of stock</p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {stats.outOfStock}
            </h2>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Featured</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-500">
              {stats.featured}
            </h2>
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-stone-950">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>

            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-600 hover:bg-stone-200"
              >
                <X size={16} />
                Cancel edit
              </button>
            )}
          </div>

          {error && (
            <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Product name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="Golden Luna Ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Price DA
              </label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="4500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="12"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Material
              </label>

              <input
                name="material"
                value={form.material}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="Gold plated"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700">
                Product Image
              </label>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                onClick={(e) => {
                  e.target.value = "";
                }}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:text-white"
              />

              {uploading && (
                <p className="mt-2 text-sm text-stone-500">
                  Uploading image...
                </p>
              )}

              {form.imageUrl && (
                <div className="mt-4 flex items-center gap-4 rounded-2xl bg-stone-50 p-3">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-20 w-20 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-950">
                      Image uploaded
                    </p>

                    <p className="truncate text-xs text-stone-500">
                      {form.imageUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-full bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-stone-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="Product description..."
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
              />
              Featured product
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />

                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Update Product"
                    : "Add Product"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-950">
                Product List
              </h2>

              <p className="mt-1 text-stone-500">
                Showing {filteredProducts.length} of {products.length} products.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-11 py-3 outline-none focus:border-stone-900"
                placeholder="Search product, material, category..."
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 capitalize outline-none focus:border-stone-900"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
            >
              <option value="all">All stock</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
            >
              <option value="all">All products</option>
              <option value="featured">Featured only</option>
              <option value="notFeatured">Not featured</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="text-left text-sm text-stone-400">
                  <th className="py-4 font-medium">Product</th>
                  <th className="py-4 font-medium">Category</th>
                  <th className="py-4 font-medium">Price</th>
                  <th className="py-4 font-medium">Stock</th>
                  <th className="py-4 font-medium">Featured</th>
                  <th className="py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-5 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />

                        <div>
                          <p className="font-semibold text-stone-950">
                            {product.name}
                          </p>

                          <p className="max-w-[320px] truncate text-stone-500">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 pr-4 capitalize text-stone-700">
                      {product.category}
                    </td>

                    <td className="py-5 pr-4 font-bold text-stone-950">
                      {product.price} DA
                    </td>

                    <td className="py-5 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.stock > 0
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </span>
                    </td>

                    <td className="py-5 pr-4">
                      <button
                        type="button"
                        disabled={updatingFeaturedId === product._id}
                        onClick={() => handleFeaturedToggle(product)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
                          product.isFeatured
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        <Star
                          size={14}
                          fill={product.isFeatured ? "currentColor" : "none"}
                        />
                        {product.isFeatured ? "Featured" : "No"}
                      </button>
                    </td>

                    <td className="py-5 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:border-stone-950 hover:text-stone-950"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <SlidersHorizontal
                  size={32}
                  className="mx-auto text-stone-300"
                />

                <p className="mt-3 text-stone-500">
                  No products match these filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-full bg-stone-950 px-5 py-2 text-sm text-white transition hover:bg-stone-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminProducts;
