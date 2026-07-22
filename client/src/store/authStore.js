import { create } from "zustand";
import api from "../api/axios";
import useCartStore from "./cartStore";

const savedUser = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const useAuthStore = create((set) => ({
  user: savedUser,
  loading: false,
  error: "",

  register: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/register", formData);

      localStorage.setItem("userInfo", JSON.stringify(res.data));

      useCartStore.getState().syncCartWithUser(true);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Register failed. Try again.";

      set({
        error: message,
        loading: false,
      });

      throw new Error(message);
    }
  },

  login: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/login", formData);

      localStorage.setItem("userInfo", JSON.stringify(res.data));

      useCartStore.getState().syncCartWithUser(true);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed.";

      set({
        error: message,
        loading: false,
      });

      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem("userInfo");

    useCartStore.getState().syncCartWithUser(false);

    set({
      user: null,
      error: "",
      loading: false,
    });
  },
}));

export default useAuthStore;
