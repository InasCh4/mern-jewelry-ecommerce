import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";

const ProductCard = ({ product }) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/product/${product._id}`} className="block">
        <div className="h-52 overflow-hidden bg-stone-100">
          <img
            src={product.images?.[0]}
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

          <p className="mt-2 text-sm text-stone-500 line-clamp-2">
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
            className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white transition hover:bg-stone-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
