import { ShoppingBag, Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import useCartStore from "../store/cartStore";

const Navbar = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a
          href="/#home"
          className="text-2xl font-extrabold tracking-[0.12em] text-stone-900"
        >
          ECLORA
        </a>

        <div className="hidden items-center gap-10 md:flex text-[15px] text-stone-600">
          <a href="/#home" className="hover:text-stone-900 transition">
            Home
          </a>

          <a href="/#products" className="hover:text-stone-900 transition">
            Shop
          </a>

          <a href="/#collections" className="hover:text-stone-900 transition">
            Collections
          </a>

          <a href="/#about" className="hover:text-stone-900 transition">
            About
          </a>
        </div>

        <div className="flex items-center gap-5 text-stone-700">
          <Search size={20} className="cursor-pointer hover:text-stone-950" />

          <User size={20} className="cursor-pointer hover:text-stone-950" />

          <Link to="/cart" className="relative">
            <ShoppingBag
              size={20}
              className="cursor-pointer hover:text-stone-950"
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
