import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

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

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, loading, error } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    const passwordError = validatePassword(form.password);

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const toastId = toast.loading("Resetting password...");

    try {
      const user = await resetPassword({
        token,
        password: form.password,
      });

      toast.success(`Password reset successfully, ${user.name}.`, {
        id: toastId,
      });

      navigate(user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.message || "Password reset failed.", {
        id: toastId,
      });
    }
  };

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-stone-950 text-white">
            <KeyRound size={28} />
          </div>

          <p className="mt-5 text-sm uppercase tracking-[0.35em] text-stone-400">
            ECLORA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950">
            Reset password
          </h1>

          <p className="mt-3 text-stone-500">
            Choose a new secure password for your account.
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-stone-700">
              New password
            </label>

            <div className="mt-2 flex items-center rounded-2xl border border-stone-200 px-4 focus-within:border-stone-950">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full py-3 outline-none"
                placeholder="New password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-400 transition hover:text-stone-950"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">
              Confirm password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound size={18} />
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Back to{" "}
          <Link to="/login" className="font-medium text-stone-950 underline">
            login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ResetPassword;
