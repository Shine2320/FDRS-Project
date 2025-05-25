import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthMiddleware() {
  const location = useLocation();

  return localStorage.getItem("refresh_token") ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
}
