import { create } from "zustand";
import api from "../api/axios";
import useCartStore from "./cartStore";

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("userInfo");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("userInfo");
    return null;
  }
};

const saveUser = (user) => {
  localStorage.setItem("userInfo", JSON.stringify(user));
  useCartStore.getState().syncCartWithUser(true);
};

const clearUser = () => {
  localStorage.removeItem("userInfo");
  useCartStore.getState().syncCartWithUser(false);
};

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || fallback;
};

const makeAuthError = (error, fallback) => {
  const authError = new Error(getErrorMessage(error, fallback));
  authError.data = error.response?.data || {};
  return authError;
};

const useAuthStore = create((set) => ({
  user: getSavedUser(),
  loading: false,
  error: "",

  register: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/register", formData);

      if (res.data?.token) {
        saveUser(res.data);

        set({
          user: res.data,
          loading: false,
          error: "",
        });
      } else {
        set({
          loading: false,
          error: "",
        });
      }

      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Register failed. Try again.");

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  login: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/login", formData);

      saveUser(res.data);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Login failed.");

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  verifyEmail: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/verify-email", formData);

      saveUser(res.data);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Email verification failed. Try again.",
      );

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  resendVerificationCode: async (email) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/resend-verification", {
        email,
      });

      set({
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Could not resend verification code.",
      );

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  forgotPassword: async (email) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.post("/auth/forgot-password", {
        email,
      });

      set({
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Could not send password reset email.",
      );

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  resetPassword: async ({ token, password }) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.patch(`/auth/reset-password/${token}`, {
        password,
      });

      saveUser(res.data);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Password reset failed.");

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  updateProfile: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.put("/auth/profile", formData);

      saveUser(res.data);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Profile update failed.");

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  changePassword: async (formData) => {
    try {
      set({ loading: true, error: "" });

      const res = await api.put("/auth/change-password", formData);

      saveUser(res.data);

      set({
        user: res.data,
        loading: false,
        error: "",
      });

      return res.data;
    } catch (error) {
      const message = getErrorMessage(error, "Password change failed.");

      set({
        error: message,
        loading: false,
      });

      throw makeAuthError(error, message);
    }
  },

  logout: () => {
    clearUser();

    set({
      user: null,
      error: "",
      loading: false,
    });
  },
}));

export default useAuthStore;
