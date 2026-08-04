import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import toast from "react-hot-toast";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import { WILAYAS, getCommunesByWilayaName } from "../data/algeriaLocations";
import AddressAutocomplete from "../components/AddressAutocomplete";

const Checkout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const submittingRef = useRef(false);

  const cartItems = useCartStore((state) => state.cartItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotalPrice = useCartStore((state) => state.getTotalPrice());

  const [deliveryRates, setDeliveryRates] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(true);

  const totalSavings = cartItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const oldPrice = Number(item.oldPrice || 0);
    const quantity = Number(item.quantity || 1);
    const discountPercent = Number(item.discountPercent || 0);

    if (oldPrice > price && discountPercent > 0) {
      return sum + (oldPrice - price) * quantity;
    }

    return sum;
  }, 0);

  const subtotalBeforeDiscount = Number(subtotalPrice || 0) + totalSavings;

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    wilaya: user?.defaultAddress?.wilaya || "",
    commune: user?.defaultAddress?.commune || "",
    address: user?.defaultAddress?.address || "",
    note: "",
    deliveryMethod: "home",
    paymentMethod: "cash",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDeliveryRates = async () => {
    try {
      setDeliveryLoading(true);

      const res = await api.get("/delivery-rates");
      setDeliveryRates(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load delivery prices.",
      );
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryRates();
  }, []);

  const wilayaOptions = WILAYAS.map((wilaya) => ({
    value: wilaya.name,
    label: `${wilaya.code} - ${wilaya.name}`,
    code: String(wilaya.code || "").padStart(2, "0"),
  }));

  const communeOptions = getCommunesByWilayaName(form.wilaya);

  const selectedWilaya =
    wilayaOptions.find((option) => option.value === form.wilaya) || null;

  const selectedCommune =
    communeOptions.find((option) => option.value === form.commune) || null;

  const selectedDeliveryRate = selectedWilaya
    ? deliveryRates.find((rate) => rate.wilayaCode === selectedWilaya.code)
    : null;

  const homeDeliveryPrice = Number(selectedDeliveryRate?.homePrice || 0);
  const officeDeliveryPrice = Number(selectedDeliveryRate?.officePrice || 0);

  const deliveryPrice =
    form.deliveryMethod === "office" ? officeDeliveryPrice : homeDeliveryPrice;

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

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    if (name === "wilaya") {
      setForm((prevForm) => ({
        ...prevForm,
        wilaya: value,
        commune: "",
        address: "",
      }));
      return;
    }

    if (name === "commune") {
      setForm((prevForm) => ({
        ...prevForm,
        commune: value,
        address: "",
      }));
    }
  };

  const validateForm = () => {
    if (cartItems.length === 0) {
      return "Your cart is empty.";
    }

    if (!form.fullName.trim()) {
      return "Full name is required.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!form.wilaya || !selectedWilaya?.code) {
      return "Please choose your wilaya.";
    }

    if (!selectedDeliveryRate) {
      return "Delivery price is not configured for this wilaya.";
    }

    if (!form.commune) {
      return "Please choose your commune.";
    }

    if (!form.address.trim()) {
      return "Address is required.";
    }

    return "";
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (submittingRef.current || loading) return;

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const toastId = toast.loading("Placing your order...");

    try {
      submittingRef.current = true;
      setLoading(true);

      const payload = {
        customerInfo: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          wilaya: form.wilaya,
          wilayaCode: selectedWilaya.code,
          commune: form.commune,
          address: form.address.trim(),
          note: form.note.trim(),
        },

        orderItems: cartItems.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),

        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
      };

      const res = await api.post("/orders", payload);

      clearCart();

      toast.success("Order placed successfully.", {
        id: toastId,
      });

      navigate(`/order-success/${res.data._id}`, {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Could not place your order. Please try again.";

      setError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setLoading(false);
      submittingRef.current = false;
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

          <p className="mt-3 text-stone-500">
            Your order will be linked to your account.
          </p>
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

                {form.wilaya && selectedDeliveryRate && (
                  <p className="mt-2 text-xs text-stone-500">
                    Delivery price loaded from admin settings.
                  </p>
                )}

                {form.wilaya && !selectedDeliveryRate && !deliveryLoading && (
                  <p className="mt-2 text-xs text-red-500">
                    Delivery price is not configured for this wilaya.
                  </p>
                )}
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
                    setForm((prevForm) => ({
                      ...prevForm,
                      address,
                    }))
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
                  disabled={!selectedDeliveryRate}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                >
                  <option value="home">
                    Home delivery
                    {selectedDeliveryRate ? ` - ${homeDeliveryPrice} DA` : ""}
                  </option>

                  <option value="office">
                    Delivery office
                    {selectedDeliveryRate ? ` - ${officeDeliveryPrice} DA` : ""}
                  </option>
                </select>

                {deliveryLoading && (
                  <p className="mt-2 text-xs text-stone-500">
                    Loading delivery prices...
                  </p>
                )}

                {!form.wilaya && !deliveryLoading && (
                  <p className="mt-2 text-xs text-amber-600">
                    Choose your wilaya to calculate delivery price.
                  </p>
                )}
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
              {cartItems.map((item) => {
                const price = Number(item.price || 0);
                const oldPrice = Number(item.oldPrice || 0);
                const quantity = Number(item.quantity || 1);
                const discountPercent = Number(item.discountPercent || 0);
                const hasDiscount = oldPrice > price && discountPercent > 0;
                const lineTotal = price * quantity;

                return (
                  <div key={item._id} className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                      {hasDiscount && (
                        <span className="absolute left-1 top-1 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          -{discountPercent}%
                        </span>
                      )}

                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-stone-950">
                        {item.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-stone-500">
                          {quantity} × {price} DA
                        </p>

                        {hasDiscount && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            Sale
                          </span>
                        )}
                      </div>

                      {hasDiscount && (
                        <p className="mt-0.5 text-xs text-stone-400">
                          Old price:{" "}
                          <span className="line-through">{oldPrice} DA</span>
                        </p>
                      )}

                      <p className="mt-1 text-sm font-semibold text-stone-900">
                        {lineTotal} DA
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-4 border-t border-stone-100 pt-6 text-stone-600">
              {totalSavings > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Before discount</span>

                  <span className="whitespace-nowrap line-through">
                    {subtotalBeforeDiscount} DA
                  </span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="flex justify-between gap-4 text-red-600">
                  <span>You save</span>

                  <span className="whitespace-nowrap">-{totalSavings} DA</span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span>Subtotal</span>

                <span className="whitespace-nowrap">{subtotalPrice} DA</span>
              </div>

              <div className="flex justify-between gap-4">
                <span>Delivery</span>

                <span className="whitespace-nowrap">
                  {deliveryLoading
                    ? "Loading..."
                    : selectedDeliveryRate
                      ? `${deliveryPrice} DA`
                      : "Choose wilaya"}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-stone-100 pt-4 text-xl font-bold text-stone-950">
                <span>Total</span>

                <span className="whitespace-nowrap">{totalPrice} DA</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || deliveryLoading || cartItems.length === 0}
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
