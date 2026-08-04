import { useEffect, useMemo, useState } from "react";
import { Heart, LogOut, Search, ShoppingBag, User, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Navbar = () => {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, logout } = useAuthStore();

  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const clearWishlistState = useWishlistStore(
    (state) => state.clearWishlistState,
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    if (user?._id) {
      getWishlist(user._id).catch(() => {});
    } else {
      clearWishlistState();
    }
  }, [user?._id, getWishlist, clearWishlistState]);

  const handleLogout = async () => {
    toast.success("Logged out successfully.");

    await sleep(700);

    clearWishlistState();
    logout();

    navigate("/login", {
      replace: true,
      state: {
        fromLogout: true,
      },
    });
  };

  const handleWishlistClick = () => {
    if (user) return;

    toast.error("Please login to view your wishlist.");

    navigate("/login", {
      state: {
        from: {
          pathname: "/wishlist",
        },
      },
    });
  };

  const openSearch = async () => {
    setSearchOpen(true);

    if (products.length > 0) return;

    try {
      setSearchLoading(true);

      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      toast.error("Could not load products.");
    } finally {
      setSearchLoading(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const goToSale = () => {
    navigate({
      pathname: "/",
      search: "?sale=1",
      hash: "#products",
    });
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return products.slice(0, 6);

    return products
      .filter((product) => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.material?.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [products, searchQuery]);

  const handleResultClick = (productId) => {
    closeSearch();
    navigate(`/product/${productId}`);
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();

    if (!query) {
      toast.error("Type something to search.");
      return;
    }

    closeSearch();

    navigate({
      pathname: "/",
      search: `?search=${encodeURIComponent(query)}`,
      hash: "#products",
    });
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    if (searchOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-[0.12em] text-stone-900"
          >
            ECLORA
          </Link>

          <div className="hidden items-center gap-8 text-[15px] text-stone-600 md:flex">
            <a href="/#home" className="transition hover:text-stone-900">
              Home
            </a>

            <a href="/#products" className="transition hover:text-stone-900">
              Shop
            </a>

            <button
              type="button"
              onClick={goToSale}
              className="group inline-flex items-center gap-2 font-medium text-red-500 transition hover:text-red-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 transition group-hover:scale-125" />
              Sale
            </button>

            <a href="/#collections" className="transition hover:text-stone-900">
              Collections
            </a>

            <a href="/#about" className="transition hover:text-stone-900">
              About
            </a>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-full bg-stone-950 px-4 py-2 text-sm text-white transition hover:bg-stone-700"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 text-stone-700">
            <button
              type="button"
              onClick={goToSale}
              className="text-sm font-semibold text-red-500 transition hover:text-red-600 md:hidden"
            >
              Sale
            </button>

            <button
              type="button"
              onClick={openSearch}
              className="cursor-pointer transition hover:text-stone-950"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>

            {user ? (
              <Link
                to="/wishlist"
                className="relative text-stone-700 transition hover:text-red-500"
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  fill={wishlistCount > 0 ? "currentColor" : "none"}
                  className={wishlistCount > 0 ? "text-red-500" : ""}
                />

                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleWishlistClick}
                className="text-stone-700 transition hover:text-red-500"
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </button>
            )}

            {!user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="hidden rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-950 hover:text-stone-950 sm:inline-flex"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="hidden rounded-full bg-stone-950 px-4 py-2 text-sm text-white transition hover:bg-stone-700 md:inline-flex"
                >
                  Register
                </Link>

                <Link to="/login" className="sm:hidden">
                  <User
                    size={20}
                    className="cursor-pointer transition hover:text-stone-950"
                  />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/account"
                  className="hidden items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-200 sm:flex"
                >
                  <User size={17} />

                  <span className="max-w-[90px] truncate">{user.name}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            <Link to="/cart" className="relative">
              <ShoppingBag
                size={20}
                className="cursor-pointer transition hover:text-stone-950"
              />

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-stone-950 text-[11px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </header>

      {searchOpen && (
        <div
          onClick={closeSearch}
          className="fixed inset-0 z-[80] bg-black/40 px-4 py-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <Search size={20} className="text-stone-400" />

              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-stone-400"
                placeholder="Search rings, gold, bracelets..."
              />

              <button
                type="button"
                onClick={closeSearch}
                className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-950"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-y-auto">
              {searchLoading ? (
                <p className="py-8 text-center text-stone-500">
                  Loading products...
                </p>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const price = Number(product.price || 0);
                    const oldPrice = Number(product.oldPrice || 0);
                    const discountPercent = Number(
                      product.discountPercent || 0,
                    );
                    const hasDiscount = oldPrice > price && discountPercent > 0;

                    return (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handleResultClick(product._id)}
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-stone-50"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          {hasDiscount && (
                            <span className="absolute left-1 top-1 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              -{discountPercent}%
                            </span>
                          )}

                          <img
                            src={product.images?.[0] || product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-950">
                            {product.name}
                          </p>

                          <p className="mt-1 truncate text-sm text-stone-500">
                            {product.category} · {product.material || "Jewelry"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="whitespace-nowrap font-semibold text-stone-950">
                            {price} DA
                          </p>

                          {hasDiscount && (
                            <p className="mt-0.5 whitespace-nowrap text-xs text-stone-400 line-through">
                              {oldPrice} DA
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-lg font-semibold text-stone-950">
                    No products found
                  </p>

                  <p className="mt-2 text-sm text-stone-500">
                    Try another keyword like ring, gold, necklace, bracelet.
                  </p>
                </div>
              )}
            </div>

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="mt-5 w-full rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                View all results for “{searchQuery.trim()}”
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
