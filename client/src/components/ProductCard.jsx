import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const addToCart = useCartStore((state) => state.addToCart);
  const user = useAuthStore((state) => state.user);

  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const clearWishlistState = useWishlistStore(
    (state) => state.clearWishlistState,
  );

  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isOutOfStock = product.stock <= 0;

  const isWishlisted = useMemo(() => {
    if (!user || !product?._id) return false;

    return wishlistItems.some((wishlistProduct) => {
      const wishlistProductId = wishlistProduct?._id || wishlistProduct;

      return wishlistProductId?.toString() === product._id?.toString();
    });
  }, [user, product?._id, wishlistItems]);

  useEffect(() => {
    if (user?._id) {
      getWishlist(user._id).catch(() => {});
    } else {
      clearWishlistState();
    }
  }, [user?._id, getWishlist, clearWishlistState]);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock.");
      return;
    }

    addToCart(product);
    toast.success(`${product.name} added to cart.`);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to use wishlist.");

      navigate("/login", {
        state: {
          from: {
            pathname: `/product/${product._id}`,
          },
        },
      });

      return;
    }

    try {
      setWishlistLoading(true);

      const res = await toggleWishlist(product._id, user._id);

      toast.success(res.message || "Wishlist updated.");
    } catch (error) {
      toast.error(error.message || "Could not update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={wishlistLoading}
        className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isWishlisted
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-white/85 text-stone-500 hover:bg-white hover:text-red-500"
        }`}
        aria-label="Toggle wishlist"
      >
        <Heart size={19} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <Link to={`/product/${product._id}`} className="block">
        <div className="h-52 overflow-hidden bg-stone-100">
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="p-4 pb-0">
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">
            {product.category}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-stone-900">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-stone-500">
            {product.description}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between p-4">
        <span className="text-base font-bold text-stone-900">
          {product.price} DA
        </span>

        <div className="flex items-center gap-2">
          <Link
            to={`/product/${product._id}`}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
          >
            View
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isOutOfStock ? "Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
