import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import useAuthStore from "../store/authStore";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(form);
      navigate("/");
    } catch (error) {
      console.log(error.message);
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
            Create account
          </h1>

          <p className="mt-3 text-stone-500">
            Join ECLORA and keep your orders in one place.
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
              Full name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-950"
              placeholder="Inas Chabla"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700">Email</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
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
                className="w-full py-3 outline-none"
                placeholder="Minimum 6 characters"
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
            <UserPlus size={18} />
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-stone-950 underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
