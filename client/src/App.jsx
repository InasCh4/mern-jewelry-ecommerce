import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";

function LandingPage() {
  return (
    <>
      <Home />
      <Shop />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
