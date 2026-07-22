import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const Account = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
    } catch (error) {
      console.log("Could not load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
            Manage your profile, orders, and account access.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-stone-100">
              <User size={38} className="text-stone-700" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-stone-950">
              {profile?.name}
            </h2>

            <p className="mt-2 text-stone-500">{profile?.email}</p>

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
