import { useEffect, useState } from "react";
import {
  Banknote,
  CreditCard,
  RefreshCcw,
  Save,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const defaultForm = {
  cash: {
    isActive: true,
    displayName: "Cash on delivery",
    description: "Pay when your order arrives.",
    instructions:
      "The customer pays the full order amount directly to the delivery agent.",
    accountName: "",
    accountNumber: "",
  },
  baridimob: {
    isActive: false,
    displayName: "BaridiMob",
    description: "Pay using BaridiMob transfer.",
    instructions:
      "After placing the order, send the transfer receipt through WhatsApp.",
    accountName: "",
    accountNumber: "",
  },
  card: {
    isActive: false,
    displayName: "Card payment",
    description: "Online card payment will be available soon.",
    instructions: "Card payment provider is not connected yet.",
    accountName: "",
    accountNumber: "",
  },
  paymentNotice:
    "Your order will be confirmed after payment verification when required.",
};

const paymentCards = [
  {
    key: "cash",
    title: "Cash on delivery",
    icon: Banknote,
  },
  {
    key: "baridimob",
    title: "BaridiMob",
    icon: Smartphone,
  },
  {
    key: "card",
    title: "Card payment",
    icon: CreditCard,
  },
];

const AdminPaymentSettings = () => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await api.get("/payment-settings");

      setForm({
        ...defaultForm,
        ...res.data,
        cash: {
          ...defaultForm.cash,
          ...res.data.cash,
        },
        baridimob: {
          ...defaultForm.baridimob,
          ...res.data.baridimob,
        },
        card: {
          ...defaultForm.card,
          ...res.data.card,
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load payment settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateMethodField = (method, field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [method]: {
        ...prevForm[method],
        [field]: value,
      },
    }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    if (
      !form.cash.isActive &&
      !form.baridimob.isActive &&
      !form.card.isActive
    ) {
      toast.error("At least one payment method must be active.");
      return;
    }

    const toastId = toast.loading("Saving payment settings...");

    try {
      setSaving(true);

      const res = await api.put("/payment-settings", form);

      setForm({
        ...defaultForm,
        ...res.data,
        cash: {
          ...defaultForm.cash,
          ...res.data.cash,
        },
        baridimob: {
          ...defaultForm.baridimob,
          ...res.data.baridimob,
        },
        card: {
          ...defaultForm.card,
          ...res.data.card,
        },
      });

      toast.success("Payment settings saved.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not save payment settings.",
        {
          id: toastId,
        },
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    const confirmReset = window.confirm(
      "Reset all payment settings to default values?",
    );

    if (!confirmReset) return;

    const toastId = toast.loading("Resetting payment settings...");

    try {
      setResetting(true);

      const res = await api.post("/payment-settings/reset");

      setForm({
        ...defaultForm,
        ...res.data.settings,
        cash: {
          ...defaultForm.cash,
          ...res.data.settings.cash,
        },
        baridimob: {
          ...defaultForm.baridimob,
          ...res.data.settings.baridimob,
        },
        card: {
          ...defaultForm.card,
          ...res.data.settings.card,
        },
      });

      toast.success("Payment settings reset.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not reset payment settings.",
        {
          id: toastId,
        },
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">
          Loading payment settings...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <form onSubmit={saveSettings} className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Payment Settings
            </h1>

            <p className="mt-3 text-stone-500">
              Control payment methods shown to customers during checkout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchSettings}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={resetSettings}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? "Resetting..." : "Reset"}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <section className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-stone-700">
            Payment notice
          </label>

          <textarea
            value={form.paymentNotice}
            onChange={(e) =>
              setForm((prevForm) => ({
                ...prevForm,
                paymentNotice: e.target.value,
              }))
            }
            rows="3"
            className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
            placeholder="Message shown to customers..."
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {paymentCards.map((card) => {
            const Icon = card.icon;
            const method = form[card.key];

            return (
              <section
                key={card.key}
                className={`rounded-[2rem] bg-white p-6 shadow-sm ring-1 transition ${
                  method.isActive
                    ? "ring-green-100"
                    : "ring-transparent opacity-80"
                }`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-full ${
                        method.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-stone-950">
                        {card.title}
                      </h2>

                      <p className="text-sm text-stone-500">
                        {method.isActive ? "Active" : "Hidden"}
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(method.isActive)}
                      onChange={(e) =>
                        updateMethodField(
                          card.key,
                          "isActive",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 accent-stone-950"
                    />

                    <span className="text-sm text-stone-600">Show</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Display name
                    </label>

                    <input
                      value={method.displayName}
                      onChange={(e) =>
                        updateMethodField(
                          card.key,
                          "displayName",
                          e.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                      placeholder="Payment name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Description
                    </label>

                    <textarea
                      value={method.description}
                      onChange={(e) =>
                        updateMethodField(
                          card.key,
                          "description",
                          e.target.value,
                        )
                      }
                      rows="3"
                      className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                      placeholder="Short explanation..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Instructions
                    </label>

                    <textarea
                      value={method.instructions}
                      onChange={(e) =>
                        updateMethodField(
                          card.key,
                          "instructions",
                          e.target.value,
                        )
                      }
                      rows="4"
                      className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                      placeholder="Payment instructions..."
                    />
                  </div>

                  {card.key === "baridimob" && (
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium text-stone-700">
                          Account name
                        </label>

                        <input
                          value={method.accountName}
                          onChange={(e) =>
                            updateMethodField(
                              card.key,
                              "accountName",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                          placeholder="Account holder"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-stone-700">
                          Account number / RIP
                        </label>

                        <input
                          value={method.accountNumber}
                          onChange={(e) =>
                            updateMethodField(
                              card.key,
                              "accountNumber",
                              e.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                          placeholder="007..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </form>
    </main>
  );
};

export default AdminPaymentSettings;
