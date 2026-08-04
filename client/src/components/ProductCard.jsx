import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star } from "lucide-react";
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
  const averageRating = Number(product.rating || 0);

  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice || 0);
  const discountPercent = Number(product.discountPercent || 0);

  const hasDiscount = oldPrice > price && discountPercent > 0;

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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {hasDiscount && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          -{discountPercent}%
        </span>
      )}

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
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">
              {product.category}
            </p>

            <div className="flex shrink-0 items-center gap-1 text-xs text-stone-500">
              <Star
                size={14}
                fill={averageRating > 0 ? "currentColor" : "none"}
                className={
                  averageRating > 0 ? "text-amber-400" : "text-stone-300"
                }
              />

              <span>
                {averageRating > 0
                  ? `${averageRating.toFixed(1)} reviews`
                  : "No reviews"}
              </span>
            </div>
          </div>

          <h3 className="mt-2 text-lg font-semibold text-stone-900">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-stone-500">
            {product.description}
          </p>
        </div>
      </Link>

      <div className="mt-auto p-4 pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="whitespace-nowrap text-lg font-semibold text-stone-900">
                {price} DA
              </p>

              {hasDiscount && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  Sale
                </span>
              )}
            </div>

            {hasDiscount && (
              <p className="mt-0.5 whitespace-nowrap text-xs text-stone-400 line-through">
                {oldPrice} DA
              </p>
            )}
          </div>

          {isOutOfStock && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              Out of stock
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/product/${product._id}`}
            className="rounded-full border border-stone-200 px-4 py-2.5 text-center text-sm text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
          >
            View
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="rounded-full bg-stone-900 px-4 py-2.5 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isOutOfStock ? "Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
