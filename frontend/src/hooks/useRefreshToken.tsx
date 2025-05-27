import { jwtDecode } from "jwt-decode";
import { axiosInstance } from "../api/apiConfig";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";
import { Role } from "../constants/roles";
import { useLocation, useNavigate } from "react-router-dom";

interface RefreshResponse {
  accessToken: string;
}

export default function useRefreshToken() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromLocation =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
  const { isLoggedIn, setAccessToken, setIsLoggedIn, setRefreshToken } =
    useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);
  const setCurrentUserName = useAuthStore((state) => state.setCurrentUserName);

  const refresh = async (): Promise<RefreshResponse | void> => {
    if (!isLoggedIn) {
      return;
    }
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) {
      return;
    }
    setRefreshToken(refresh_token);
    try {
      const response = await axiosInstance.post("auth/token/refresh/", {
        refresh: refresh_token,
      });
      if (response.data.access) {
        const accessToken: string = response.data.access;
        setAccessToken(accessToken);
        const decoded: any = jwtDecode(response.data.access);
        setCurrentUserRole(decoded.role);
        setCurrentUserName(decoded.name);

        return { accessToken };
      } else {
        console.error("Failed to refresh token");
        setIsLoggedIn(false);
        return;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      setIsLoggedIn(false);
      setCurrentUserRole(Role.None);
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("isLoggedIn");
      setAccessToken(null);     
      setIsLoggedIn(false);
      navigate(fromLocation, { replace: true });
      return;
    }
  };

  return refresh;
}
