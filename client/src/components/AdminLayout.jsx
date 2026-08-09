import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const getCachedBrandSettings = () => {
  try {
    const cached = localStorage.getItem("ecloraBrandSettings");

    if (!cached) {
      return {
        shopName: "ECLORA",
        logoUrl: "",
      };
    }

    const parsed = JSON.parse(cached);

    return {
      shopName: parsed.shopName || "ECLORA",
      logoUrl: parsed.logoUrl || "",
    };
  } catch {
    return {
      shopName: "ECLORA",
      logoUrl: "",
    };
  }
};

const navItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Delivery Prices",
    path: "/admin/delivery-rates",
    icon: Truck,
  },
  {
    label: "Site Settings",
    path: "/admin/site-settings",
    icon: Settings,
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    label: "Payment Settings",
    path: "/admin/payment-settings",
    icon: CreditCard,
  },
];

const soonItems = [
  {
    label: "Analytics",
    icon: BarChart3,
  },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const clearWishlistState = useWishlistStore(
    (state) => state.clearWishlistState,
  );

  const [brand, setBrand] = useState(() => getCachedBrandSettings());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const brandName = brand.shopName || "ECLORA";

  const saveBrandToState = (brandData) => {
    const cleanBrand = {
      shopName: brandData.shopName || "ECLORA",
      logoUrl: brandData.logoUrl || "",
    };

    setBrand(cleanBrand);

    localStorage.setItem("ecloraBrandSettings", JSON.stringify(cleanBrand));
  };

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await api.get("/site-settings");

        saveBrandToState({
          shopName: res.data.shopName,
          logoUrl: res.data.logoUrl,
        });
      } catch (error) {
        console.log("Could not load admin brand settings:", error);
      }
    };

    fetchBrand();
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

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    clearWishlistState();
    logout();

    toast.success("Logged out successfully.");

    navigate("/login", {
      replace: true,
      state: {
        fromLogout: true,
      },
    });
  };

  const renderBrandLogo = (isCollapsed = false) => {
    if (brand.logoUrl) {
      return (
        <img
          src={brand.logoUrl}
          alt={brandName}
          className={`shrink-0 rounded-full border border-white/10 object-cover shadow-sm ${
            isCollapsed ? "h-11 w-11" : "h-12 w-12"
          }`}
        />
      );
    }

    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-white text-sm font-black text-stone-950 ${
          isCollapsed ? "h-11 w-11" : "h-12 w-12"
        }`}
      >
        {brandName.charAt(0)}
      </span>
    );
  };

  const renderNavItem = (item, isCollapsed = false, isDisabled = false) => {
    const Icon = item.icon;

    if (isDisabled) {
      return (
        <button
          key={item.label}
          type="button"
          disabled
          className={`flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isCollapsed ? "justify-center" : "gap-3"
          } text-stone-400/70`}
          title={item.label}
        >
          <Icon size={18} />

          {!isCollapsed && (
            <>
              <span>{item.label}</span>

              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-400">
                Soon
              </span>
            </>
          )}
        </button>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        onClick={closeMobileSidebar}
        title={item.label}
        className={({ isActive }) =>
          `flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isCollapsed ? "justify-center" : "gap-3"
          } ${
            isActive
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-300 hover:bg-white/10 hover:text-white"
          }`
        }
      >
        <Icon size={18} />
        {!isCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const sidebarContent = (isCollapsed = false, isMobile = false) => (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between gap-3"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className={`flex min-w-0 items-center ${
              isCollapsed ? "justify-center" : "gap-3 text-left"
            }`}
          >
            {renderBrandLogo(isCollapsed)}

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-2xl font-black tracking-[0.08em] text-white">
                  {brandName}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.35em] text-stone-400">
                  Admin Panel
                </p>
              </div>
            )}
          </button>

          {isMobile && !isCollapsed && (
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-stone-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close admin sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
        {!isCollapsed && (
          <p className="px-3 text-xs uppercase tracking-[0.32em] text-stone-500">
            Manage
          </p>
        )}

        <nav className="mt-4 space-y-2">
          {navItems.map((item) => renderNavItem(item, isCollapsed))}
        </nav>

        {!isCollapsed && (
          <p className="mt-8 px-3 text-xs uppercase tracking-[0.32em] text-stone-500">
            Coming next
          </p>
        )}

        <div className="mt-4 space-y-2">
          {soonItems.map((item) => renderNavItem(item, isCollapsed, true))}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          title="Back to store"
          className={`flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Home size={18} />
          {!isCollapsed && <span>Back to store</span>}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`mt-2 flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 hover:text-red-100 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen bg-stone-950 transition-all duration-300 lg:block ${
          desktopCollapsed ? "w-24" : "w-72"
        }`}
      >
        {sidebarContent(desktopCollapsed, false)}
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close admin sidebar"
          />

          <aside className="absolute left-0 top-0 h-full w-[85%] max-w-80 bg-stone-950 shadow-2xl">
            {sidebarContent(false, true)}
          </aside>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${
          desktopCollapsed ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/85 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:border-stone-950 hover:text-stone-950 lg:hidden"
                aria-label="Open admin sidebar"
              >
                <Menu size={20} />
              </button>

              <button
                type="button"
                onClick={() => setDesktopCollapsed((prev) => !prev)}
                className="hidden h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:border-stone-950 hover:text-stone-950 lg:grid"
                aria-label="Toggle admin sidebar"
              >
                {desktopCollapsed ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronLeft size={20} />
                )}
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-stone-400">
                  Admin
                </p>

                <h1 className="mt-1 text-xl font-bold text-stone-950">
                  Control Center
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-stone-950">
                  {user?.name || "Admin"}
                </p>

                <p className="text-xs capitalize text-stone-400">
                  {user?.role || "admin"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:inline-flex"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)]">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
