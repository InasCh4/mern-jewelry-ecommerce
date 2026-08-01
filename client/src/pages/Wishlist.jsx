import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import useWishlistStore from "../store/wishlistStore";

const Wishlist = () => {
  const user = useAuthStore((state) => state.user);

  const addToCart = useCartStore((state) => state.addToCart);

  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const loading = useWishlistStore((state) => state.loading);
  const getWishlist = useWishlistStore((state) => state.getWishlist);
  const removeFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist,
  );

  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    if (user?._id) {
      getWishlist(user._id).catch((error) => {
        toast.error(error.message || "Could not load wishlist.");
      });
    }
  }, [user, getWishlist]);

  const cleanWishlistItems = useMemo(() => {
    return wishlistItems.filter(Boolean);
  }, [wishlistItems]);

  const handleRemove = async (product) => {
    try {
      setRemovingId(product._id);

      const res = await removeFromWishlist(product._id);

      toast.success(res.message || "Product removed from wishlist.");
    } catch (error) {
      toast.error(error.message || "Could not remove product.");
    } finally {
      setRemovingId("");
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    addToCart(product);
    toast.success(`${product.name} added to cart.`);
  };

  if (loading && cleanWishlistItems.length === 0) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading wishlist...</p>
      </main>
    );
  }

  if (cleanWishlistItems.length === 0) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-500">
            <Heart size={28} />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-stone-950">
            Your wishlist is empty
          </h1>

          <p className="mt-3 text-stone-500">
            Save your favorite ECLORA pieces here.
          </p>

          <Link
            to="/#products"
            className="mt-8 inline-flex rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
          >
            Explore products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Wishlist
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Saved Pieces
            </h1>

            <p className="mt-3 text-stone-500">
              {cleanWishlistItems.length} favorite{" "}
              {cleanWishlistItems.length === 1 ? "product" : "products"} saved.
            </p>
          </div>

          <Link
            to="/#products"
            className="w-fit rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cleanWishlistItems.map((product) => (
            <div
              key={product._id}
              className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
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

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-stone-900">
                    {product.price} DA
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.stock > 0
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {product.stock > 0 ? "In stock" : "Out"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    <ShoppingBag size={16} />
                    Add
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(product)}
                    disabled={removingId === product._id}
                    className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
