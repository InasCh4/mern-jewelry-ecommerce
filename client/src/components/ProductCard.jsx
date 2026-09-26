import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const formatPrice = (price) => `${Number(price || 0).toLocaleString()} DA`;

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

  const isOutOfStock = Number(product.stock || 0) <= 0;
  const averageRating = Number(product.rating || 0);

  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice || 0);
  const discountPercent = Number(product.discountPercent || 0);

  const hasDiscount = oldPrice > price && discountPercent > 0;
  const productImage = product.images?.[0] || product.image;

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
    <article className="group relative flex h-[560px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-[#0d0d0d]">
      <div className="relative h-[260px] shrink-0 overflow-hidden rounded-[1.55rem] bg-white/[0.04]">
        {hasDiscount && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-lg">
            -{discountPercent}%
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute right-3 top-3 z-10 grid h-12 w-12 place-items-center rounded-full backdrop-blur-xl transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/20 text-white hover:bg-white hover:text-black"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        <Link to={`/product/${product._id}`} className="block h-full">
          <img
            src={productImage}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs uppercase tracking-[0.35em] text-[#d8c2a2]">
                {product.category || "Jewelry"}
              </p>

              <div className="flex shrink-0 items-center gap-1 text-sm text-white/70">
                <Star
                  size={15}
                  fill={averageRating > 0 ? "currentColor" : "none"}
                  className={
                    averageRating > 0 ? "text-[#d8c2a2]" : "text-white/35"
                  }
                />

                <span>
                  {averageRating > 0
                    ? `${averageRating.toFixed(1)} reviews`
                    : "No reviews"}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-1 pb-1 pt-6">
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="line-clamp-1 font-serif text-3xl leading-tight tracking-[-0.04em] text-white">
            {product.name}
          </h3>

          <p className="mt-3 line-clamp-2 min-h-[56px] text-base leading-7 text-white/45">
            {product.description || "Elegant jewelry piece selected by ECLORA."}
          </p>
        </Link>

        <div className="mt-auto">
          <div className="min-h-[64px]">
            <div className="flex min-h-[32px] items-center gap-3">
              <p className="text-2xl font-black text-white">
                {formatPrice(price)}
              </p>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  hasDiscount
                    ? "bg-red-500/12 text-red-300"
                    : "invisible bg-transparent text-transparent"
                }`}
              >
                Sale
              </span>
            </div>

            <p
              className={`mt-2 min-h-[20px] text-sm ${
                hasDiscount ? "text-white/28 line-through" : "invisible"
              }`}
            >
              {formatPrice(oldPrice || price)}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[0.82fr_1.18fr] gap-3">
            <Link
              to={`/product/${product._id}`}
              className="grid h-12 place-items-center rounded-full border border-white/10 text-sm font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              View
            </Link>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35 disabled:hover:scale-100"
            >
              <ShoppingBag size={17} />
              {isOutOfStock ? "Out" : "Add"}
            </button>
          </div>
        </div>
      </div>

      <Link
        to={`/product/${product._id}`}
        className="pointer-events-none absolute opacity-0"
        aria-hidden="true"
      >
        <ArrowRight size={1} />
      </Link>
    </article>
  );
};

export default ProductCard;
