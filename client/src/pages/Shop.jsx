import { useEffect, useState } from "react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-stone-50">
        <p className="text-stone-500">Loading jewels...</p>
      </div>
    );
  }

  return (
    <>
      <section id="products" className="bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Jewelry Collection
            </p>
            <h1 className="mt-3 text-4xl font-bold text-stone-900">
              Our Products
            </h1>
            <p className="mt-3 text-stone-500">
              Elegant pieces selected for a soft luxury look.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Shop;
