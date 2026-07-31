import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  CalendarDays,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import { WILAYAS, getCommunesByWilayaName } from "../data/algeriaLocations";
import AddressAutocomplete from "../components/AddressAutocomplete";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Account = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, loading: updating } = useAuthStore();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    wilaya: user?.defaultAddress?.wilaya || "",
    commune: user?.defaultAddress?.commune || "",
    address: user?.defaultAddress?.address || "",
  });

  const wilayaOptions = WILAYAS.map((wilaya) => ({
    value: wilaya.name,
    label: `${wilaya.code} - ${wilaya.name}`,
  }));

  const communeOptions = getCommunesByWilayaName(form.wilaya);

  const selectedWilaya =
    wilayaOptions.find((option) => option.value === form.wilaya) || null;

  const selectedCommune =
    communeOptions.find((option) => option.value === form.commune) || null;

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

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");

      setProfile(res.data);

      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        wilaya: res.data.defaultAddress?.wilaya || "",
        commune: res.data.defaultAddress?.commune || "",
        address: res.data.defaultAddress?.address || "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Could not load profile.");
      toast.error(error.response?.data?.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim()) {
      const message = "Name and email are required.";
      setError(message);
      toast.error(message);
      return;
    }

    const toastId = toast.loading("Saving profile...");

    try {
      const updatedUser = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        defaultAddress: {
          wilaya: form.wilaya,
          commune: form.commune,
          address: form.address.trim(),
        },
      });

      await sleep(700);

      setProfile((prevProfile) => ({
        ...prevProfile,
        ...updatedUser,
      }));

      setSuccess("");
      toast.success("Profile updated successfully.", {
        id: toastId,
      });
    } catch (error) {
      const message = error.message || "Could not update profile.";

      setError(message);
      toast.error(message, {
        id: toastId,
      });
    }
  };

  const handleLogout = async () => {
    toast.success("Logged out successfully.");

    await sleep(700);

    logout();

    navigate("/login", {
      replace: true,
      state: {
        fromLogout: true,
      },
    });
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-bold text-stone-950">My Account</h1>

          <p className="mt-3 text-stone-500">
            Manage your profile, orders, and default delivery information.
          </p>
        </div>

        {(error || success) && (
          <div className="mb-6 space-y-3">
            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
                {success}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-stone-100">
              <User size={38} className="text-stone-700" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-stone-950">
              {profile?.name}
            </h2>

            <p className="mt-2 text-stone-500">{profile?.email}</p>

            {profile?.phone && (
              <p className="mt-2 text-sm text-stone-500">{profile.phone}</p>
            )}

            <span
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                profile?.role === "admin"
                  ? "bg-stone-950 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              <ShieldCheck size={16} />
              {profile?.role}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-6 py-3 text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={18} />
              Logout
            </button>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">
                Edit profile
              </h2>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Name
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                    placeholder="you@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                    placeholder="0550 00 00 00"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-stone-700">
                      Default wilaya
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
                      Default commune
                    </label>

                    <div className="mt-2">
                      <Select
                        options={communeOptions}
                        value={selectedCommune}
                        onChange={(option) =>
                          handleSelectChange("commune", option?.value || "")
                        }
                        placeholder={
                          form.wilaya
                            ? "Search commune..."
                            : "Choose wilaya first"
                        }
                        isSearchable
                        isDisabled={!form.wilaya}
                        styles={selectStyles}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Default address
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
                    This address will be used automatically during checkout.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />
                  {updating ? "Saving..." : "Save changes"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">
                Profile details
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <User size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Name</p>
                    <p className="font-semibold text-stone-950">
                      {profile?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <Mail size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Email</p>
                    <p className="font-semibold text-stone-950">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <Phone size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Phone</p>
                    <p className="font-semibold text-stone-950">
                      {profile?.phone || "Not added yet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white">
                    <MapPin size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Default address</p>

                    {profile?.defaultAddress?.address ? (
                      <>
                        <p className="font-semibold text-stone-950">
                          {profile.defaultAddress.address}
                        </p>

                        <p className="mt-1 text-sm text-stone-500">
                          {profile.defaultAddress.commune},{" "}
                          {profile.defaultAddress.wilaya}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-stone-950">
                        Not added yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <CalendarDays size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Joined</p>
                    <p className="font-semibold text-stone-950">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">
                Quick actions
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  to="/my-orders"
                  className="rounded-2xl border border-stone-100 p-5 transition hover:border-stone-950 hover:bg-stone-50"
                >
                  <Package size={24} className="text-stone-700" />

                  <h3 className="mt-4 font-bold text-stone-950">My Orders</h3>

                  <p className="mt-2 text-sm text-stone-500">
                    View your order history and status.
                  </p>
                </Link>

                {profile?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="rounded-2xl border border-stone-100 p-5 transition hover:border-stone-950 hover:bg-stone-50"
                  >
                    <ShieldCheck size={24} className="text-stone-700" />

                    <h3 className="mt-4 font-bold text-stone-950">
                      Admin Dashboard
                    </h3>

                    <p className="mt-2 text-sm text-stone-500">
                      Manage products and orders.
                    </p>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Account;
