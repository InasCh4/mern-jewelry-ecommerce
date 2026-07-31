import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useCartStore from "../store/cartStore";

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

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

  const fetchProduct = async () => {
    try {
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
          <div className="overflow-hidden rounded-[1.5rem] bg-stone-100">
            <img
              src={product.images?.[0]}
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

            <div className="mt-6 flex items-center gap-4">
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
                {product.material}
              </span>
            </p>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="mt-6 inline-flex w-fit items-center gap-3 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <ShoppingBag size={20} />
              {product.stock <= 0
                ? "Out of stock"
                : added
                  ? "Added ✓"
                  : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
