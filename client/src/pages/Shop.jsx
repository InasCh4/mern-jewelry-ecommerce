import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const Shop = () => {
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [saleFilter, setSaleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.log("Error fetching products:", error);
      toast.error("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search") || "";
    const sale = params.get("sale") || "";

    setSearchQuery(search);
    setSaleFilter(sale === "1" ? "sale" : "all");

    if (location.hash === "#products") {
      setTimeout(() => {
        const productsSection = document.getElementById("products");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, [location.search, location.hash]);

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["all", ...new Set(uniqueCategories)];
  }, [products]);

  const saleProductsCount = useMemo(() => {
    return products.filter((product) => {
      const price = Number(product.price || 0);
      const oldPrice = Number(product.oldPrice || 0);
      const discountPercent = Number(product.discountPercent || 0);

      return oldPrice > price && discountPercent > 0;
    }).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let result = products.filter((product) => {
      const price = Number(product.price || 0);
      const oldPrice = Number(product.oldPrice || 0);
      const discountPercent = Number(product.discountPercent || 0);

      const hasDiscount = oldPrice > price && discountPercent > 0;

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.material?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const matchesSale = saleFilter === "all" || hasDiscount;

      return matchesSearch && matchesCategory && matchesSale;
    });

    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    if (sortBy === "featured") {
      result = [...result].sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
      );
    }

    if (sortBy === "discount-high") {
      result = [...result].sort(
        (a, b) =>
          Number(b.discountPercent || 0) - Number(a.discountPercent || 0),
      );
    }

    return result;
  }, [products, searchQuery, categoryFilter, saleFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSaleFilter("all");
    setSortBy("latest");
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-50">
        <p className="text-stone-500">Loading jewels...</p>
      </div>
    );
  }

  return (
    <section id="products" className="scroll-mt-24 bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
            Jewelry Collection
          </p>

          <h1 className="mt-3 text-4xl font-bold text-stone-900">
            Our Products
          </h1>

          <p className="mt-3 text-stone-500">
            Elegant pieces selected for a soft luxury look.
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-11 py-3 outline-none focus:border-stone-900"
                placeholder="Search ring, necklace, gold..."
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 capitalize outline-none focus:border-stone-900"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All categories" : category}
                </option>
              ))}
            </select>

            <select
              value={saleFilter}
              onChange={(e) => setSaleFilter(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
            >
              <option value="all">All products</option>
              <option value="sale">On sale ({saleProductsCount})</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
            >
              <option value="latest">Latest</option>
              <option value="featured">Featured first</option>
              <option value="discount-high">Best discount</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              <SlidersHorizontal size={17} />
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
            <p>
              Showing {filteredProducts.length} of {products.length} products.
            </p>

            {saleProductsCount > 0 && (
              <p className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-600">
                {saleProductsCount} on sale
              </p>
            )}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-stone-100">
              <Search size={24} className="text-stone-400" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-stone-950">
              No products found
            </h2>

            <p className="mt-2 text-stone-500">
              Try another keyword or clear the filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Shop;
