import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  ShoppingBag,
  Star,
} from "lucide-react";
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
  const [reviewLoading, setReviewLoading] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    comment: "",
  });

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

  const hasReviewed = useMemo(() => {
    if (!user || !product?.reviews?.length) return false;

    return product.reviews.some((review) => {
      const reviewUserId = review.user?._id || review.user;

      return reviewUserId?.toString() === user._id?.toString();
    });
  }, [user, product?.reviews]);

  const averageRating = Number(product?.rating || 0);
  const numReviews = Number(product?.numReviews || 0);

  const price = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || 0);
  const discountPercent = Number(product?.discountPercent || 0);

  const hasDiscount = oldPrice > price && discountPercent > 0;

  const renderStars = (value, size = 18) => {
    const roundedValue = Math.round(Number(value || 0));

    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        fill={index < roundedValue ? "currentColor" : "none"}
        className={index < roundedValue ? "text-amber-400" : "text-stone-300"}
      />
    ));
  };

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

  const handleReviewChange = (e) => {
    const { name, value } = e.target;

    setReviewForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!product) return;

    if (!user) {
      toast.error("Please login to write a review.");

      navigate("/login", {
        state: {
          from: {
            pathname: `/product/${product._id}`,
          },
        },
      });

      return;
    }

    if (hasReviewed) {
      toast.error("You already reviewed this product.");
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error("Please write your review comment.");
      return;
    }

    const rating = Number(reviewForm.rating);

    if (rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }

    const toastId = toast.loading("Submitting review...");

    try {
      setReviewLoading(true);

      const res = await api.post(`/products/${product._id}/reviews`, {
        rating,
        comment: reviewForm.comment.trim(),
      });

      setProduct(res.data.product);

      setReviewForm({
        rating: "5",
        comment: "",
      });

      toast.success(res.data.message || "Review added successfully.", {
        id: toastId,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not submit review.";

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setReviewLoading(false);
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
            {hasDiscount && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                -{discountPercent}%
              </span>
            )}

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
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
                {product.category}
              </p>

              {hasDiscount && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  Sale
                </span>
              )}
            </div>

            <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight text-stone-950 md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(averageRating)}
              </div>

              <p className="text-sm text-stone-500">
                {averageRating ? averageRating.toFixed(1) : "0.0"} / 5 ·{" "}
                {numReviews} {numReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            <p className="mt-5 text-lg leading-8 text-stone-600">
              {product.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="whitespace-nowrap text-3xl font-semibold text-stone-950">
                    {price} DA
                  </span>

                  {hasDiscount && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {hasDiscount && (
                  <p className="mt-1 whitespace-nowrap text-sm text-stone-400 line-through">
                    {oldPrice} DA
                  </p>
                )}
              </div>

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

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} className="text-stone-700" />

              <div>
                <h2 className="text-2xl font-bold text-stone-950">
                  Customer Reviews
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {numReviews} {numReviews === 1 ? "person has" : "people have"}{" "}
                  reviewed this product.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {product.reviews?.length > 0 ? (
                product.reviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-2xl border border-stone-100 bg-stone-50 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-bold text-stone-950">
                          {review.name}
                        </p>

                        <p className="mt-1 text-xs text-stone-400">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString(
                                "en-GB",
                              )
                            : "Recently"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {renderStars(review.rating, 16)}
                      </div>
                    </div>

                    <p className="mt-4 leading-7 text-stone-600">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-stone-50 p-6 text-center">
                  <p className="font-semibold text-stone-950">No reviews yet</p>

                  <p className="mt-2 text-sm text-stone-500">
                    Be the first to leave a review for this piece.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm md:p-7">
            <h2 className="text-2xl font-bold text-stone-950">
              Write a review
            </h2>

            {!user ? (
              <div className="mt-5 rounded-2xl bg-stone-50 p-5">
                <p className="text-sm text-stone-600">
                  Please login to write a review.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", {
                      state: {
                        from: {
                          pathname: `/product/${product._id}`,
                        },
                      },
                    })
                  }
                  className="mt-4 rounded-full bg-stone-950 px-5 py-2 text-sm text-white transition hover:bg-stone-700"
                >
                  Login
                </button>
              </div>
            ) : hasReviewed ? (
              <div className="mt-5 rounded-2xl bg-green-50 p-5 text-green-700">
                You already reviewed this product. Thank you ⭐
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Rating
                  </label>

                  <select
                    name="rating"
                    value={reviewForm.rating}
                    onChange={handleReviewChange}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                  >
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Comment
                  </label>

                  <textarea
                    name="comment"
                    value={reviewForm.comment}
                    onChange={handleReviewChange}
                    rows="5"
                    className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                    placeholder="Share your thoughts about this product..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewLoading ? "Submitting..." : "Submit review"}
                </button>
              </form>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
};

export default ProductDetails;
