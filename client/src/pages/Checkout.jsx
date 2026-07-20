import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import { WILAYAS, getCommunesByWilayaName } from "../data/algeriaLocations";
import AddressAutocomplete from "../components/AddressAutocomplete";

const Checkout = () => {
  const navigate = useNavigate();

  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotalPrice = useCartStore((state) => state.getTotalPrice());

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    wilaya: "",
    commune: "",
    address: "",
    note: "",
    deliveryMethod: "home",
    paymentMethod: "cash",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wilayaOptions = WILAYAS.map((wilaya) => ({
    value: wilaya.name,
    label: `${wilaya.code} - ${wilaya.name}`,
  }));

  const communeOptions = getCommunesByWilayaName(form.wilaya);

  const selectedWilaya =
    wilayaOptions.find((option) => option.value === form.wilaya) || null;

  const selectedCommune =
    communeOptions.find((option) => option.value === form.commune) || null;

  const deliveryPrice = form.deliveryMethod === "home" ? 500 : 300;
  const totalPrice = subtotalPrice + deliveryPrice;

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "50px",
      borderRadius: "1rem",
      borderColor: state.isFocused ? "#1c1917" : "#e7e5e4",
      boxShadow: "none",
      paddingLeft: "4px",
      paddingRight: "4px",
      "&:hover": {
        borderColor: "#1c1917",
      },
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#1c1917"
        : state.isFocused
          ? "#f5f5f4"
          : "white",
      color: state.isSelected ? "white" : "#1c1917",
      cursor: "pointer",
    }),

    menu: (base) => ({
      ...base,
      borderRadius: "1rem",
      overflow: "hidden",
      zIndex: 50,
    }),

    placeholder: (base) => ({
      ...base,
      color: "#a8a29e",
    }),

    singleValue: (base) => ({
      ...base,
      color: "#1c1917",
    }),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSelectChange = (name, value) => {
    if (name === "wilaya") {
      setForm({
        ...form,
        wilaya: value,
        commune: "",
        address: "",
      });
      return;
    }

    if (name === "commune") {
      setForm({
        ...form,
        commune: value,
        address: "",
      });
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !form.fullName ||
      !form.phone ||
      !form.wilaya ||
      !form.commune ||
      !form.address
    ) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerInfo: {
          fullName: form.fullName,
          phone: form.phone,
          wilaya: form.wilaya,
          commune: form.commune,
          address: form.address,
          note: form.note,
        },

        orderItems: cartItems.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),

        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
        deliveryPrice,
      };

      const res = await api.post("/orders", payload);

      clearCart();
      navigate(`/order-success/${res.data._id}`);
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-stone-950">
            Your cart is empty
          </h1>

          <p className="mt-3 text-stone-500">
            Add some pieces before checkout.
          </p>

          <Link
            to="/#products"
            className="mt-8 inline-flex rounded-full bg-stone-950 px-7 py-3 text-white transition hover:bg-stone-700"
          >
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
            Checkout
          </p>

          <h1 className="mt-3 text-4xl font-bold text-stone-950">
            Complete Your Order
          </h1>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-stone-950">
              Delivery Information
            </h2>

            {error && (
              <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Full name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="0550 00 00 00"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Wilaya
                </label>

                <div className="mt-2">
                  <Select
                    options={wilayaOptions}
                    value={selectedWilaya}
                    onChange={(option) =>
                      handleSelectChange("wilaya", option?.value || "")
                    }
                    placeholder="Search wilaya..."
                    isSearchable
                    styles={selectStyles}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Commune
                </label>

                <div className="mt-2">
                  <Select
                    options={communeOptions}
                    value={selectedCommune}
                    onChange={(option) =>
                      handleSelectChange("commune", option?.value || "")
                    }
                    placeholder={
                      form.wilaya ? "Search commune..." : "Choose wilaya first"
                    }
                    isSearchable
                    isDisabled={!form.wilaya}
                    styles={selectStyles}
                  />
                </div>

                {selectedCommune?.daira && (
                  <p className="mt-2 text-xs text-stone-500">
                    Daïra: {selectedCommune.daira}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-700">
                  Address
                </label>

                <AddressAutocomplete
                  value={form.address}
                  wilaya={form.wilaya}
                  commune={form.commune}
                  disabled={!form.commune}
                  onChange={(address) =>
                    setForm({
                      ...form,
                      address,
                    })
                  }
                />

                <p className="mt-2 text-xs text-stone-400">
                  Start typing your street, district, cité, or building name.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-stone-700">
                  Note
                </label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows="4"
                  className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Any delivery note..."
                />
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Delivery method
                </label>

                <select
                  name="deliveryMethod"
                  value={form.deliveryMethod}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                >
                  <option value="home">Home delivery - 500 DA</option>
                  <option value="office">Delivery office - 300 DA</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">
                  Payment method
                </label>

                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                >
                  <option value="cash">Cash on delivery</option>
                  <option value="baridimob">BaridiMob transfer</option>
                  <option value="card">Card payment later</option>
                </select>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-stone-950">Order Summary</h2>

            <div className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <img
                    src={item.images?.[0]}
                    alt={item.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-950">
                      {item.name}
                    </h3>

                    <p className="text-sm text-stone-500">
                      {item.quantity} × {item.price} DA
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4 border-t border-stone-100 pt-6 text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{subtotalPrice} DA</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{deliveryPrice} DA</span>
              </div>

              <div className="flex justify-between border-t border-stone-100 pt-4 text-xl font-bold text-stone-950">
                <span>Total</span>
                <span>{totalPrice} DA</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-full bg-stone-950 px-6 py-4 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Placing order..." : "Place Order"}
            </button>

            <Link
              to="/cart"
              className="mt-4 block text-center text-sm text-stone-500 hover:text-stone-950"
            >
              Back to cart
            </Link>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
