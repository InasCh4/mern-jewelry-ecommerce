import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import api from "../api/axios";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        console.log("Error fetching order:", error);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-600">
          <CheckCircle size={40} />
        </div>

        <h1 className="mt-6 text-4xl font-bold text-stone-950">
          Order placed successfully
        </h1>

        <p className="mt-3 text-stone-500">
          Your order has been received. We will contact you soon.
        </p>

        {order && (
          <div className="mt-8 rounded-3xl bg-stone-50 p-6 text-left">
            <p className="text-sm text-stone-500">Order ID</p>
            <p className="mt-1 break-all font-semibold text-stone-950">
              {order._id}
            </p>

            <div className="mt-5 flex justify-between">
              <span className="text-stone-500">Total</span>
              <span className="font-bold text-stone-950">
                {order.totalPrice} DA
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-stone-500">Status</span>
              <span className="font-bold capitalize text-stone-950">
                {order.orderStatus}
              </span>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/#products"
            className="rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
          >
            Continue Shopping
          </Link>

          <Link
            to="/"
            className="rounded-full border border-stone-300 px-7 py-3 text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccess;
