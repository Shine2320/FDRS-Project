import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthMiddleware() {
  const location = useLocation();

  return localStorage.getItem("refresh_token") ? (
    <Outlet />
  ) : (
    <Navigate to="/auth/login" state={{ from: location }} replace />
  );
}
