import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCachedBrandSettings = () => {
  try {
    const cached = localStorage.getItem("ecloraBrandSettings");

    if (!cached) {
      return {
        shopName: "",
        logoUrl: "",
      };
    }

    const parsed = JSON.parse(cached);

    return {
      shopName: parsed.shopName || "",
      logoUrl: parsed.logoUrl || "",
    };
  } catch {
    return {
      shopName: "",
      logoUrl: "",
    };
  }
};

const Navbar = () => {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, logout } = useAuthStore();

  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const clearWishlistState = useWishlistStore(
    (state) => state.clearWishlistState,
  );

  const cachedBrand = getCachedBrandSettings();

  const [settings, setSettings] = useState(cachedBrand);
  const [brandReady, setBrandReady] = useState(Boolean(cachedBrand.shopName));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const wishlistCount = wishlistItems.length;

  const saveBrandToState = (brand) => {
    const cleanBrand = {
      shopName: brand.shopName || "ECLORA",
      logoUrl: brand.logoUrl || "",
    };

    setSettings(cleanBrand);
    setBrandReady(true);

    localStorage.setItem("ecloraBrandSettings", JSON.stringify(cleanBrand));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/site-settings");

        saveBrandToState({
          shopName: res.data.shopName,
          logoUrl: res.data.logoUrl,
        });
      } catch (error) {
        console.log("Could not load navbar settings:", error);

        if (!settings.shopName) {
          saveBrandToState({
            shopName: "ECLORA",
            logoUrl: "",
          });
        }
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const handleSettingsUpdated = (event) => {
      if (event.detail) {
        saveBrandToState({
          shopName: event.detail.shopName,
          logoUrl: event.detail.logoUrl,
        });
      }
    };

    window.addEventListener("site-settings-updated", handleSettingsUpdated);

    return () => {
      window.removeEventListener(
        "site-settings-updated",
        handleSettingsUpdated,
      );
    };
  }, []);

  useEffect(() => {
    if (user?._id) {
      getWishlist(user._id).catch(() => {});
    } else {
      clearWishlistState();
    }
  }, [user?._id, getWishlist, clearWishlistState]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    toast.success("Logged out successfully.");

    await sleep(500);

    closeMobileMenu();
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

  const goToSale = () => {
    closeMobileMenu();

    navigate({
      pathname: "/",
      search: "?sale=1",
      hash: "#products",
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
        closeMobileMenu();
      }
    };

    if (searchOpen || mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [searchOpen, mobileMenuOpen]);

  const brandName = settings.shopName || "ECLORA";

  return (
    <>
      <header className="sticky top-0 z-50 w-full overflow-x-clip border-b border-stone-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 shrink items-center gap-3 text-stone-900"
          >
            {brandReady ? (
              settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={brandName}
                  className="h-11 w-11 shrink-0 rounded-full border border-stone-200 object-cover shadow-sm"
                />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-black text-white">
                  {brandName.charAt(0)}
                </span>
              )
            ) : (
              <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-stone-100" />
            )}

            {brandReady ? (
              <span className="max-w-[115px] truncate text-2xl font-black tracking-[0.04em] text-stone-950 sm:max-w-[170px] xl:max-w-[220px]">
                {brandName}
              </span>
            ) : (
              <span className="h-7 w-28 animate-pulse rounded-full bg-stone-100" />
            )}
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-5 text-sm font-semibold text-stone-500 lg:flex">
            <a
              href="/#home"
              className="whitespace-nowrap transition hover:text-stone-950"
            >
              Home
            </a>

            <a
              href="/#products"
              className="whitespace-nowrap transition hover:text-stone-950"
            >
              Shop
            </a>

            <a
              href="/#collections"
              className="whitespace-nowrap transition hover:text-stone-950"
            >
              Collections
            </a>

            <a
              href="/#about"
              className="whitespace-nowrap transition hover:text-stone-950"
            >
              About
            </a>

            <button
              type="button"
              onClick={goToSale}
              className="group inline-flex items-center gap-2 whitespace-nowrap font-bold text-red-500 transition hover:text-red-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 transition group-hover:scale-125" />
              Sale
            </button>

            {user && (
              <Link
                to="/my-orders"
                className="whitespace-nowrap transition hover:text-stone-950"
              >
                My Orders
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-full bg-stone-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-stone-700"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-stone-700 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:border-stone-950 hover:text-stone-950 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <button
              type="button"
              onClick={openSearch}
              className="grid h-11 w-11 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>

            {user ? (
              <Link
                to="/wishlist"
                className="relative grid h-11 w-11 place-items-center rounded-full text-stone-600 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  fill={wishlistCount > 0 ? "currentColor" : "none"}
                  className={wishlistCount > 0 ? "text-red-500" : ""}
                />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleWishlistClick}
                className="grid h-11 w-11 place-items-center rounded-full text-stone-600 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </button>
            )}

            {!user ? (
              <Link
                to="/login"
                className="grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200 hover:text-stone-950"
                aria-label="Login"
              >
                <User size={20} />
              </Link>
            ) : (
              <Link
                to="/account"
                className="grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200 hover:text-stone-950"
                aria-label="Account"
              >
                <User size={20} />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative grid h-11 w-11 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-stone-950 text-[11px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] xl:hidden">
          <button
            type="button"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close mobile menu"
          />

          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="flex min-w-0 items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={brandName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-stone-950 text-sm font-black text-white">
                    {brandName.charAt(0)}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="truncate text-xl font-black text-stone-950">
                    {brandName}
                  </p>

                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                    Menu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              <a
                href="/#home"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              >
                Home
              </a>

              <a
                href="/#products"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              >
                Shop
              </a>

              <a
                href="/#collections"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              >
                Collections
              </a>

              <a
                href="/#about"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
              >
                About
              </a>

              <button
                type="button"
                onClick={goToSale}
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-bold text-red-500 transition hover:bg-red-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Sale
              </button>

              {user && (
                <Link
                  to="/my-orders"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950"
                >
                  My Orders
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="mt-4 block rounded-2xl bg-stone-950 px-4 py-3 text-center font-bold text-white transition hover:bg-stone-700"
                >
                  Admin Panel
                </Link>
              )}

              {!user && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-full border border-stone-200 px-4 py-3 text-center text-sm font-semibold text-stone-700 transition hover:border-stone-950"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-full bg-stone-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-stone-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}

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
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
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
                          <p className="font-bold text-stone-950">{price} DA</p>

                          {hasDiscount && (
                            <p className="text-xs text-stone-400 line-through">
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
