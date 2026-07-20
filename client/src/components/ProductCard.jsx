import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product._id}`}
      className="group block overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-52 overflow-hidden bg-stone-100">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">
          {product.category}
        </p>

        <h3 className="mt-2 text-lg font-semibold text-stone-900">
          {product.name}
        </h3>

        <p className="mt-2 text-sm text-stone-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-bold text-stone-900">
            {product.price} DA
          </span>

          <span className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white">
            View
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
