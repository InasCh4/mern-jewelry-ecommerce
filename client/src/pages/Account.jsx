import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import { WILAYAS, getCommunesByWilayaName } from "../data/algeriaLocations";
import AddressAutocomplete from "../components/AddressAutocomplete";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return "";
};

const Account = () => {
  const navigate = useNavigate();

  const {
    user,
    logout,
    updateProfile,
    changePassword,
    resendVerificationCode,
    loading: authLoading,
  } = useAuthStore();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    wilaya: user?.defaultAddress?.wilaya || "",
    commune: user?.defaultAddress?.commune || "",
    address: user?.defaultAddress?.address || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
      minHeight: "48px",
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
      const message =
        error.response?.data?.message || "Could not load profile.";

      setError(message);
      toast.error(message);
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

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prevForm) => ({
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

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email) {
      const message = "Name and email are required.";
      setError(message);
      toast.error(message);
      return;
    }

    const toastId = toast.loading("Saving profile...");

    try {
      const updatedUser = await updateProfile({
        name,
        email,
        phone,
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

      if (updatedUser.isEmailVerified === false) {
        toast.success("Profile updated. Please verify your new email.", {
          id: toastId,
        });

        return;
      }

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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setError("");

    if (profile?.authProvider !== "local") {
      toast.error(
        "Password change is only available for email/password accounts.",
      );
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Current password and new password are required.");
      return;
    }

    const passwordError = validatePassword(passwordForm.newPassword);

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    const toastId = toast.loading("Changing password...");

    try {
      const updatedUser = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      await sleep(700);

      setProfile((prevProfile) => ({
        ...prevProfile,
        ...updatedUser,
      }));

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password changed successfully.", {
        id: toastId,
      });
    } catch (error) {
      const message = error.message || "Could not change password.";

      setError(message);
      toast.error(message, {
        id: toastId,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!profile?.email) {
      toast.error("Email not available.");
      return;
    }

    const toastId = toast.loading("Sending verification code...");

    try {
      const data = await resendVerificationCode(profile.email);

      toast.success(data.message || "Verification code sent.", {
        id: toastId,
      });

      navigate("/verify-email", {
        state: {
          email: profile.email,
        },
      });
    } catch (error) {
      toast.error(error.message || "Could not send verification code.", {
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
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Account
            </p>

            <h1 className="mt-2 text-3xl font-bold text-stone-950 md:text-4xl">
              My Account
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Manage your profile, delivery address, password, and account
              security.
            </p>
          </div>

          <Link
            to="/#products"
            className="w-fit rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
          >
            Continue shopping
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-stone-100">
                <User size={32} className="text-stone-700" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-stone-950">
                {profile?.name}
              </h2>

              <p className="mt-1 truncate text-sm text-stone-500">
                {profile?.email}
              </p>

              {profile?.phone && (
                <p className="mt-1 text-sm text-stone-500">{profile.phone}</p>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold capitalize ${
                    profile?.role === "admin"
                      ? "bg-stone-950 text-white"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  <ShieldCheck size={15} />
                  {profile?.role}
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    profile?.isEmailVerified
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {profile?.isEmailVerified ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <XCircle size={15} />
                  )}
                  {profile?.isEmailVerified ? "Verified email" : "Unverified"}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-4 py-2 text-xs font-semibold capitalize text-stone-600">
                  <KeyRound size={15} />
                  {profile?.authProvider || "local"}
                </span>
              </div>

              {!profile?.isEmailVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={authLoading}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw size={16} />
                  Send verification code
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={17} />
                Logout
              </button>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-950">
                Quick actions
              </h2>

              <div className="mt-5 space-y-3">
                <Link
                  to="/my-orders"
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 p-4 transition hover:border-stone-950 hover:bg-stone-50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-stone-100">
                    <Package size={19} className="text-stone-700" />
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-950">My Orders</h3>
                    <p className="text-xs text-stone-500">
                      Track your purchases.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 p-4 transition hover:border-red-200 hover:bg-red-50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-red-50">
                    <Heart size={19} className="text-red-500" />
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-950">Wishlist</h3>
                    <p className="text-xs text-stone-500">
                      Saved favorite pieces.
                    </p>
                  </div>
                </Link>

                {profile?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 rounded-2xl border border-stone-100 p-4 transition hover:border-stone-950 hover:bg-stone-50"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-stone-100">
                      <ShieldCheck size={19} className="text-stone-700" />
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-950">Admin</h3>
                      <p className="text-xs text-stone-500">
                        Manage store data.
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <form
              onSubmit={handleUpdateProfile}
              className="rounded-[2rem] bg-white p-6 shadow-sm md:p-7"
            >
              <div className="flex flex-col gap-2 border-b border-stone-100 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-950">
                    Profile settings
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Update your personal information and delivery defaults.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {authLoading ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
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

                  <p className="mt-2 text-xs text-stone-400">
                    If you change your email, the new email must be verified.
                  </p>
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

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Joined
                  </label>

                  <div className="mt-2 flex h-[50px] items-center gap-3 rounded-2xl border border-stone-200 px-4 text-stone-600">
                    <CalendarDays size={18} className="text-stone-400" />
                    <span>
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-[1.5rem] bg-stone-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white">
                    <MapPin size={19} className="text-stone-700" />
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-950">
                      Default delivery address
                    </h3>
                    <p className="text-sm text-stone-500">
                      Used automatically during checkout.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                  </div>
                </div>
              </div>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="rounded-[2rem] bg-white p-6 shadow-sm md:p-7"
            >
              <div className="flex flex-col gap-2 border-b border-stone-100 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-950">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Manage your password and account access.
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    profile?.isEmailVerified
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {profile?.isEmailVerified ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <XCircle size={15} />
                  )}
                  {profile?.isEmailVerified ? "Email verified" : "Verify email"}
                </span>
              </div>

              {profile?.authProvider === "google" ? (
                <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-600">
                  This account uses Google login. Password changes are managed
                  by Google, not ECLORA.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        Current password
                      </label>

                      <div className="mt-2 flex items-center rounded-2xl border border-stone-200 px-4 focus-within:border-stone-950">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordFormChange}
                          autoComplete="current-password"
                          className="w-full py-3 outline-none"
                          placeholder="Current password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="text-stone-400 transition hover:text-stone-950"
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        New password
                      </label>

                      <div className="mt-2 flex items-center rounded-2xl border border-stone-200 px-4 focus-within:border-stone-950">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordFormChange}
                          autoComplete="new-password"
                          className="w-full py-3 outline-none"
                          placeholder="New password"
                        />

                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-stone-400 transition hover:text-stone-950"
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        Confirm password
                      </label>

                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFormChange}
                        autoComplete="new-password"
                        className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-stone-400">
                    Password must contain at least 8 characters, one uppercase
                    letter, one lowercase letter, and one number.
                  </p>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound size={17} />
                    {authLoading ? "Updating..." : "Change password"}
                  </button>
                </>
              )}

              {!profile?.isEmailVerified && (
                <div className="mt-6 rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Your email is not verified yet.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    Verify your email to keep your account secure and avoid
                    future login restrictions.
                  </p>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={authLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MailCheck size={16} />
                    Send verification code
                  </button>
                </div>
              )}
            </form>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-7">
              <h2 className="text-2xl font-bold text-stone-950">
                Account summary
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <Mail size={20} className="text-stone-700" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-stone-500">Email</p>
                    <p className="truncate font-semibold text-stone-950">
                      {profile?.email}
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        profile?.isEmailVerified
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {profile?.isEmailVerified ? "Verified" : "Not verified"}
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

                <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4 md:col-span-2">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                    <ShieldCheck size={20} className="text-stone-700" />
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Account type</p>
                    <p className="font-semibold capitalize text-stone-950">
                      {profile?.authProvider || "local"} account ·{" "}
                      {profile?.role || "user"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-stone-50 p-4 md:col-span-2">
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
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Account;
