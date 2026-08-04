import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCcw, Save, Search, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

const AdminDeliveryRates = () => {
  const [rates, setRates] = useState([]);
  const [draftRates, setDraftRates] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchRates = async () => {
    try {
      setLoading(true);

      const res = await api.get("/delivery-rates");

      setRates(res.data);

      const drafts = {};

      res.data.forEach((rate) => {
        drafts[rate._id] = {
          homePrice: rate.homePrice,
          officePrice: rate.officePrice,
          isActive: rate.isActive,
        };
      });

      setDraftRates(drafts);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load delivery rates.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const filteredRates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return rates;

    return rates.filter((rate) => {
      return (
        rate.wilayaName?.toLowerCase().includes(query) ||
        rate.wilayaCode?.toLowerCase().includes(query)
      );
    });
  }, [rates, searchQuery]);

  const handleDraftChange = (rateId, field, value) => {
    setDraftRates((prevDrafts) => ({
      ...prevDrafts,
      [rateId]: {
        ...prevDrafts[rateId],
        [field]: field === "isActive" ? value : value,
      },
    }));
  };

  const saveRate = async (rateId) => {
    const draft = draftRates[rateId];

    if (!draft) return;

    const homePrice = Number(draft.homePrice);
    const officePrice = Number(draft.officePrice);

    if (homePrice < 0 || officePrice < 0) {
      toast.error("Delivery prices cannot be negative.");
      return;
    }

    const toastId = toast.loading("Saving delivery price...");

    try {
      setSavingId(rateId);

      const res = await api.put(`/delivery-rates/${rateId}`, {
        homePrice,
        officePrice,
        isActive: draft.isActive,
      });

      setRates((prevRates) =>
        prevRates.map((rate) => (rate._id === rateId ? res.data : rate)),
      );

      toast.success("Delivery price updated.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save rate.", {
        id: toastId,
      });
    } finally {
      setSavingId("");
    }
  };

  const resetRates = async () => {
    const confirmReset = window.confirm(
      "Reset all delivery prices to default values?",
    );

    if (!confirmReset) return;

    const toastId = toast.loading("Resetting delivery prices...");

    try {
      setResetting(true);

      const res = await api.post("/delivery-rates/reset");

      setRates(res.data.rates);

      const drafts = {};

      res.data.rates.forEach((rate) => {
        drafts[rate._id] = {
          homePrice: rate.homePrice,
          officePrice: rate.officePrice,
          isActive: rate.isActive,
        };
      });

      setDraftRates(drafts);

      toast.success("Delivery prices reset.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reset rates.", {
        id: toastId,
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading delivery prices...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Delivery Prices
            </h1>

            <p className="mt-3 text-stone-500">
              Edit delivery prices by wilaya without touching the code.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-11 py-3 outline-none focus:border-stone-900"
              placeholder="Search wilaya or code..."
            />
          </div>

          <button
            type="button"
            onClick={fetchRates}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={resetRates}
            disabled={resetting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Truck size={17} />
            {resetting ? "Resetting..." : "Reset defaults"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-[2rem] bg-white p-5 shadow-sm">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="text-left text-sm text-stone-400">
                <th className="w-[120px] py-4 pr-5 font-medium">Code</th>
                <th className="w-[250px] py-4 pr-5 font-medium">Wilaya</th>
                <th className="w-[170px] py-4 pr-5 font-medium">
                  Home delivery
                </th>
                <th className="w-[170px] py-4 pr-5 font-medium">
                  Office delivery
                </th>
                <th className="w-[120px] py-4 pr-5 font-medium">Active</th>
                <th className="w-[150px] py-4 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRates.map((rate) => {
                const draft = draftRates[rate._id] || {
                  homePrice: rate.homePrice,
                  officePrice: rate.officePrice,
                  isActive: rate.isActive,
                };

                return (
                  <tr
                    key={rate._id}
                    className="border-t border-stone-100 text-sm"
                  >
                    <td className="py-4 pr-5 font-semibold text-stone-950">
                      {rate.wilayaCode}
                    </td>

                    <td className="py-4 pr-5">
                      <p className="font-semibold text-stone-950">
                        {rate.wilayaName}
                      </p>
                    </td>

                    <td className="py-4 pr-5">
                      <input
                        type="number"
                        min="0"
                        value={draft.homePrice}
                        onChange={(e) =>
                          handleDraftChange(
                            rate._id,
                            "homePrice",
                            e.target.value,
                          )
                        }
                        className="w-32 rounded-2xl border border-stone-200 px-4 py-2 outline-none focus:border-stone-900"
                      />
                    </td>

                    <td className="py-4 pr-5">
                      <input
                        type="number"
                        min="0"
                        value={draft.officePrice}
                        onChange={(e) =>
                          handleDraftChange(
                            rate._id,
                            "officePrice",
                            e.target.value,
                          )
                        }
                        className="w-32 rounded-2xl border border-stone-200 px-4 py-2 outline-none focus:border-stone-900"
                      />
                    </td>

                    <td className="py-4 pr-5">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.isActive)}
                          onChange={(e) =>
                            handleDraftChange(
                              rate._id,
                              "isActive",
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 accent-stone-950"
                        />

                        <span className="text-stone-600">
                          {draft.isActive ? "Yes" : "No"}
                        </span>
                      </label>
                    </td>

                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => saveRate(rate._id)}
                        disabled={savingId === rate._id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save size={15} />
                        {savingId === rate._id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRates.length === 0 && (
            <p className="py-10 text-center text-stone-500">No wilaya found.</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminDeliveryRates;
