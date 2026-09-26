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
      document.body.style.overflow = "";
    };
  }, [searchOpen, mobileMenuOpen]);

  const brandName = settings.shopName || "ECLORA";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-5">
        <nav className="pointer-events-auto mx-auto flex max-w-[1500px] items-center justify-between gap-3 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-white shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <Link
            to="/"
            className="group flex min-w-0 shrink-0 items-center gap-2.5"
          >
            {brandReady ? (
              settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={brandName}
                  className="h-8 w-8 shrink-0 rounded-full border border-white/20 bg-white/10 object-cover"
                />
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 font-serif text-base text-white backdrop-blur-xl">
                  {brandName.charAt(0)}
                </span>
              )
            ) : (
              <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10" />
            )}

            {brandReady ? (
              <span className="max-w-[105px] truncate font-serif text-xl text-white sm:max-w-[160px]">
                {brandName}
              </span>
            ) : (
              <span className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
            )}
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 lg:flex">
            <a href="/#home" className="transition hover:text-white">
              Home
            </a>

            <a href="/#products" className="transition hover:text-white">
              Shop
            </a>

            <a href="/#collections" className="transition hover:text-white">
              Collections
            </a>

            <a href="/#about" className="transition hover:text-white">
              About
            </a>

            <button
              type="button"
              onClick={goToSale}
              className="group inline-flex items-center gap-2 font-bold text-red-300 transition hover:text-red-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-300 transition group-hover:scale-125" />
              Sale
            </button>

            {user && (
              <Link to="/my-orders" className="transition hover:text-white">
                My Orders
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-full bg-white/15 px-4 py-2 text-[10px] font-bold text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-white hover:text-black lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <button
              type="button"
              onClick={openSearch}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-white hover:text-black"
              aria-label="Search products"
            >
              <Search size={16} />
            </button>

            {user ? (
              <Link
                to="/wishlist"
                className="relative grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-red-500 hover:text-white"
                aria-label="Wishlist"
              >
                <Heart
                  size={16}
                  fill={wishlistCount > 0 ? "currentColor" : "none"}
                  className={wishlistCount > 0 ? "text-red-300" : ""}
                />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleWishlistClick}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-red-500 hover:text-white"
                aria-label="Wishlist"
              >
                <Heart size={16} />
              </button>
            )}

            {!user ? (
              <Link
                to="/login"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-white hover:text-black"
                aria-label="Login"
              >
                <User size={16} />
              </Link>
            ) : (
              <Link
                to="/account"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-white hover:text-black"
                aria-label="Account"
              >
                <User size={16} />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-white hover:text-black"
              aria-label="Cart"
            >
              <ShoppingBag size={16} />

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px] font-bold text-black">
                  {totalItems}
                </span>
              )}
            </Link>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:bg-red-500 hover:text-white sm:grid"
                aria-label="Logout"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close mobile menu"
          />

          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-l border-white/10 bg-[#090909]/95 p-6 text-white shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex min-w-0 items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={brandName}
                    className="h-10 w-10 rounded-full border border-white/10 bg-white object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-serif text-xl text-white">
                    {brandName.charAt(0)}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="truncate font-serif text-2xl text-white">
                    {brandName}
                  </p>

                  <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                    Menu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white hover:text-black"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              <a
                href="/#home"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </a>

              <a
                href="/#products"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Shop
              </a>

              <a
                href="/#collections"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Collections
              </a>

              <a
                href="/#about"
                onClick={closeMobileMenu}
                className="block rounded-2xl px-4 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                About
              </a>

              <button
                type="button"
                onClick={goToSale}
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-bold text-red-400 transition hover:bg-red-500/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Sale
              </button>

              {user && (
                <Link
                  to="/my-orders"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  My Orders
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="mt-4 block rounded-2xl bg-white px-4 py-3 text-center font-bold text-black transition hover:scale-[1.02]"
                >
                  Admin Panel
                </Link>
              )}

              {!user && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-full border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white/75 transition hover:bg-white hover:text-black"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-black transition hover:scale-[1.02]"
                  >
                    Register
                  </Link>
                </div>
              )}

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}

      {searchOpen && (
        <div
          onClick={closeSearch}
          className="fixed inset-0 z-[80] bg-black/70 px-4 py-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-5 text-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Search size={20} className="text-white/40" />

              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="flex-1 bg-transparent py-2 text-lg text-white outline-none placeholder:text-white/35"
                placeholder="Search rings, gold, bracelets..."
              />

              <button
                type="button"
                onClick={closeSearch}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/60 transition hover:bg-white hover:text-black"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-y-auto">
              {searchLoading ? (
                <p className="py-8 text-center text-white/50">
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
                        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-white/5"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
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
                          <p className="truncate font-semibold text-white">
                            {product.name}
                          </p>

                          <p className="mt-1 truncate text-sm text-white/45">
                            {product.category} · {product.material || "Jewelry"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-white">{price} DA</p>

                          {hasDiscount && (
                            <p className="text-xs text-white/35 line-through">
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
                  <p className="text-lg font-semibold text-white">
                    No products found
                  </p>

                  <p className="mt-2 text-sm text-white/45">
                    Try another keyword like ring, gold, necklace, bracelet.
                  </p>
                </div>
              )}
            </div>

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="mt-5 w-full rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:scale-[1.02]"
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
