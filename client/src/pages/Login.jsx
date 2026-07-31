import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const getRedirectPath = (loggedUser) => {
    if (loggedUser.role === "admin") {
      return "/admin";
    }

    if (location.state?.fromLogout) {
      return "/";
    }

    const protectedPath = location.state?.from?.pathname;

    const blockedRedirects = ["/login", "/register", "/account"];

    if (protectedPath && !blockedRedirects.includes(protectedPath)) {
      return protectedPath;
    }

    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    const toastId = toast.loading("Logging in...");

    try {
      const loggedUser = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      });

      await sleep(800);

      toast.success(`Welcome back, ${loggedUser.name}.`, {
        id: toastId,
      });

      await sleep(400);

      navigate(getRedirectPath(loggedUser), {
        replace: true,
      });
    } catch (error) {
      const message = error.message || "Login failed.";

      toast.error(message, {
        id: toastId,
      });
    }
  };

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
            ECLORA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950">
            Welcome back
          </h1>

          <p className="mt-3 text-stone-500">
            Login to continue your jewelry shopping.
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-stone-700">Email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
              placeholder="inas@email.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">
              Password
            </label>

            <div className="mt-2 flex items-center rounded-2xl border border-stone-200 px-4 focus-within:border-stone-950">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full py-3 outline-none"
                placeholder="Your password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-400 hover:text-stone-950"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          New here?{" "}
          <Link to="/register" className="font-medium text-stone-950 underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
