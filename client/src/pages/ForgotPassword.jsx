import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const ForgotPassword = () => {
  const { forgotPassword, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    const toastId = toast.loading("Sending reset link...");

    try {
      const data = await forgotPassword(normalizedEmail);

      setSent(true);

      toast.success(data.message || "Password reset link sent.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.message || "Could not send reset link.", {
        id: toastId,
      });
    }
  };

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-stone-950 text-white">
            <Mail size={28} />
          </div>

          <p className="mt-5 text-sm uppercase tracking-[0.35em] text-stone-400">
            ECLORA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950">
            Forgot password
          </h1>

          <p className="mt-3 text-stone-500">
            Enter your email and we will send a reset link if the account
            exists.
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {sent && (
          <p className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Check your email. In development, check the backend terminal for the
            reset link.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-stone-700">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
              placeholder="inas@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail size={18} />
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Remembered your password?{" "}
          <Link to="/login" className="font-medium text-stone-950 underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;
