import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { verifyEmail, resendVerificationCode, loading, error } =
    useAuthStore();

  const initialEmail = location.state?.email || "";

  const [form, setForm] = useState({
    email: initialEmail,
    code: "",
  });

  const normalizedEmail = useMemo(
    () => form.email.trim().toLowerCase(),
    [form.email],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: name === "code" ? value.replace(/\D/g, "").slice(0, 6) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!normalizedEmail || form.code.length !== 6) {
      toast.error("Enter your email and the 6-digit code.");
      return;
    }

    const toastId = toast.loading("Verifying email...");

    try {
      const user = await verifyEmail({
        email: normalizedEmail,
        code: form.code,
      });

      toast.success(`Email verified. Welcome, ${user.name}.`, {
        id: toastId,
      });

      navigate(user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.message || "Verification failed.", {
        id: toastId,
      });
    }
  };

  const handleResend = async () => {
    if (loading) return;

    if (!normalizedEmail) {
      toast.error("Enter your email first.");
      return;
    }

    const toastId = toast.loading("Sending new code...");

    try {
      const data = await resendVerificationCode(normalizedEmail);

      toast.success(data.message || "Verification code sent.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.message || "Could not resend code.", {
        id: toastId,
      });
    }
  };

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-stone-950 text-white">
            <MailCheck size={28} />
          </div>

          <p className="mt-5 text-sm uppercase tracking-[0.35em] text-stone-400">
            ECLORA
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950">
            Verify your email
          </h1>

          <p className="mt-3 text-stone-500">
            Enter the 6-digit code sent to your email. In development, check the
            backend terminal.
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
              Verification code
            </label>

            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-stone-950"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MailCheck size={18} />
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw size={16} />
          Resend code
        </button>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already verified?{" "}
          <Link to="/login" className="font-medium text-stone-950 underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default VerifyEmail;
