import { LogOut, Search, ShoppingBag, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";

const Navbar = () => {
  const navigate = useNavigate();

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-[0.12em] text-stone-900"
        >
          ECLORA
        </Link>

        <div className="hidden items-center gap-10 text-[15px] text-stone-600 md:flex">
          <a href="/#home" className="transition hover:text-stone-900">
            Home
          </a>

          <a href="/#products" className="transition hover:text-stone-900">
            Shop
          </a>

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
            className="hidden cursor-pointer transition hover:text-stone-950 sm:block"
          >
            <Search size={20} />
          </button>

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
  );
};

export default Navbar;
