import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
