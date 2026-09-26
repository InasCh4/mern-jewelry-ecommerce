import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("all");
  const [filterType, setFilterType] = useState(
    searchParams.get("sale") === "1" ? "sale" : "all",
  );
  const [sortType, setSortType] = useState("latest");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await api.get("/products");
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log("Error fetching products:", error);
        toast.error("Could not load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    const querySale = searchParams.get("sale") === "1";

    setSearch(querySearch);
    setFilterType(querySale ? "sale" : "all");
  }, [searchParams]);

  const categories = useMemo(() => {
    const cleanCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["all", ...new Set(cleanCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const cleanSearch = search.trim().toLowerCase();

    if (cleanSearch) {
      result = result.filter((product) => {
        return (
          product.name?.toLowerCase().includes(cleanSearch) ||
          product.description?.toLowerCase().includes(cleanSearch) ||
          product.category?.toLowerCase().includes(cleanSearch) ||
          product.material?.toLowerCase().includes(cleanSearch)
        );
      });
    }

    if (category !== "all") {
      result = result.filter((product) => product.category === category);
    }

    if (filterType === "sale") {
      result = result.filter((product) => {
        const price = Number(product.price || 0);
        const oldPrice = Number(product.oldPrice || 0);
        const discountPercent = Number(product.discountPercent || 0);

        return oldPrice > price && discountPercent > 0;
      });
    }

    if (filterType === "available") {
      result = result.filter((product) => Number(product.stock || 0) > 0);
    }

    if (filterType === "out") {
      result = result.filter((product) => Number(product.stock || 0) <= 0);
    }

    result.sort((a, b) => {
      if (sortType === "price-low") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortType === "price-high") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (sortType === "rating") {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [products, search, category, filterType, sortType]);

  const saleCount = useMemo(() => {
    return products.filter((product) => {
      const price = Number(product.price || 0);
      const oldPrice = Number(product.oldPrice || 0);
      const discountPercent = Number(product.discountPercent || 0);

      return oldPrice > price && discountPercent > 0;
    }).length;
  }, [products]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setFilterType("all");
    setSortType("latest");
    setSearchParams({});
  };

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-[#050505] px-5 py-24 text-white sm:px-8 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(199,173,134,0.11),transparent_28%)]" />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mx-auto flex w-fit items-center gap-3 text-xs uppercase tracking-[0.38em] text-[#c7ad86]">
            <Sparkles size={15} />
            ECLORA selection
          </p>

          <h2 className="mt-5 font-serif text-[clamp(3rem,6vw,6.8rem)] leading-[0.88] tracking-[-0.075em] text-white">
            Our Products
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55 md:text-lg">
            Elegant pieces selected for a soft luxury look.
          </p>
        </div>

        <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl md:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.85fr_0.85fr_0.85fr_auto]">
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-5 py-3.5 text-white/70 transition focus-within:border-[#c7ad86]/60">
              <Search size={19} className="shrink-0 text-white/38" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ring, necklace, bracelet..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
              />
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-5 py-3.5 text-sm text-white/75 outline-none transition hover:border-white/20"
            >
              {categories.map((item) => (
                <option key={item} value={item} className="bg-black text-white">
                  {item === "all" ? "All Categories" : item}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-5 py-3.5 text-sm text-white/75 outline-none transition hover:border-white/20"
            >
              <option value="all" className="bg-black text-white">
                All products
              </option>
              <option value="sale" className="bg-black text-white">
                Sale only
              </option>
              <option value="available" className="bg-black text-white">
                Available
              </option>
              <option value="out" className="bg-black text-white">
                Out of stock
              </option>
            </select>

            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-5 py-3.5 text-sm text-white/75 outline-none transition hover:border-white/20"
            >
              <option value="latest" className="bg-black text-white">
                Latest
              </option>
              <option value="price-low" className="bg-black text-white">
                Price low to high
              </option>
              <option value="price-high" className="bg-black text-white">
                Price high to low
              </option>
              <option value="rating" className="bg-black text-white">
                Top rated
              </option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:scale-105"
            >
              <SlidersHorizontal size={17} />
              Reset
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{" "}
              <span className="font-semibold text-white">
                {filteredProducts.length}
              </span>{" "}
              of {products.length} products.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
                >
                  Clear search
                  <X size={14} />
                </button>
              )}

              {saleCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">
                  {saleCount} on sale
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[460px] animate-pulse rounded-[2rem] bg-white/[0.05]"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.045] p-10 text-center">
            <h3 className="font-serif text-4xl text-white">No pieces found.</h3>

            <p className="mx-auto mt-4 max-w-md text-white/50">
              Try another search, category, or reset the filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-7 rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition hover:scale-105"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Shop;
