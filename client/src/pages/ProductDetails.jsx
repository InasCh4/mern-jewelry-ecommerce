import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useWishlistStore from "../store/wishlistStore";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  const user = useAuthStore((state) => state.user);

  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const clearWishlistState = useWishlistStore(
    (state) => state.clearWishlistState,
  );

  const isWishlisted = useMemo(() => {
    if (!user || !product?._id) return false;

    return wishlistItems.some((wishlistProduct) => {
      const wishlistProductId = wishlistProduct?._id || wishlistProduct;

      return wishlistProductId?.toString() === product._id?.toString();
    });
  }, [user, product?._id, wishlistItems]);

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    addToCart(product);
    setAdded(true);

    toast.success(`${product.name} added to cart.`);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

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

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (error) {
      console.log("Error fetching product:", error);
      toast.error("Could not load product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (user?._id) {
      getWishlist(user._id).catch(() => {});
    } else {
      clearWishlistState();
    }
  }, [user?._id, getWishlist, clearWishlistState]);

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-stone-50">
        <p className="text-stone-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-stone-50">
        <p className="text-stone-500">Product not found.</p>
      </div>
    );
  }

  return (
    <main className="bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/#products"
          className="mb-8 inline-flex items-center gap-2 text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={18} />
          Back to shop
        </Link>

        <div className="grid gap-8 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-[1fr_0.95fr] md:p-7">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-stone-100">
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full backdrop-blur-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isWishlisted
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-white/85 text-stone-500 hover:bg-white hover:text-red-500"
              }`}
              aria-label="Toggle wishlist"
            >
              <Heart size={22} fill={isWishlisted ? "currentColor" : "none"} />
            </button>

            <img
              src={product.images?.[0] || product.image}
              alt={product.name}
              className="h-[360px] w-full object-cover md:h-[400px]"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              {product.category}
            </p>

            <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight text-stone-950 md:text-4xl">
              {product.name}
            </h1>

            <p className="mt-5 text-lg leading-8 text-stone-600">
              {product.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-3xl font-bold text-stone-950">
                {product.price} DA
              </span>

              <span
                className={`rounded-full px-4 py-2 text-sm ${
                  product.stock > 0
                    ? "bg-stone-100 text-stone-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                Stock: {product.stock}
              </span>
            </div>

            <p className="mt-4 text-stone-500">
              Material:{" "}
              <span className="font-medium text-stone-800">
                {product.material || "Jewelry"}
              </span>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="inline-flex w-fit items-center gap-3 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <ShoppingBag size={20} />
                {product.stock <= 0
                  ? "Out of stock"
                  : added
                    ? "Added ✓"
                    : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`inline-flex w-fit items-center gap-3 rounded-full border px-6 py-3 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isWishlisted
                    ? "border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                    : "border-stone-200 text-stone-700 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
