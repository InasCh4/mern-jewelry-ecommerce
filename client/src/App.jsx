import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyOrders from "./pages/MyOrders";
import Account from "./pages/Account";
import OrderDetails from "./pages/OrderDetails";
import Wishlist from "./pages/Wishlist";
import Invoice from "./pages/Invoice";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminDeliveryRates from "./pages/AdminDeliveryRates";
import AdminSiteSettings from "./pages/AdminSiteSettings";
import AdminCustomers from "./pages/AdminCustomers";
import AdminPaymentSettings from "./pages/AdminPaymentSettings";
import AdminAnalytics from "./pages/AdminAnalytics";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

function LandingPage() {
  return (
    <>
      <Home />
      <Shop />
      <Footer />
    </>
  );
}

function AdminPage({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}

function AppContent() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isInvoicePage = location.pathname.startsWith("/invoice");

  return (
    <>
      <ScrollToTop />

      {!isAdminPage && !isInvoicePage && <Navbar />}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "999px",
            background: "#1c1917",
            color: "#fff",
            padding: "14px 20px",
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/product/:id" element={<ProductDetails />} />

        <Route path="/cart" element={<Cart />} />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success/:id"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute>
              <Invoice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminPage>
              <AdminDashboard />
            </AdminPage>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminPage>
              <AdminProducts />
            </AdminPage>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminPage>
              <AdminOrders />
            </AdminPage>
          }
        />

        <Route
          path="/admin/delivery-rates"
          element={
            <AdminPage>
              <AdminDeliveryRates />
            </AdminPage>
          }
        />

        <Route
          path="/admin/site-settings"
          element={
            <AdminPage>
              <AdminSiteSettings />
            </AdminPage>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <AdminPage>
              <AdminCustomers />
            </AdminPage>
          }
        />

        <Route
          path="/admin/payment-settings"
          element={
            <AdminPage>
              <AdminPaymentSettings />
            </AdminPage>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <AdminPage>
              <AdminAnalytics />
            </AdminPage>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
