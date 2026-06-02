import { jwtDecode } from "jwt-decode";
import { axiosInstance } from "../api/apiConfig";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";
import { useLocation, useNavigate } from "react-router-dom";

interface RefreshResponse {
  accessToken: string;
}

export default function useRefreshToken() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, setAccessToken, setIsLoggedIn, setRefreshToken } =
    useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);
  const setCurrentUserName = useAuthStore((state) => state.setCurrentUserName);
  const resetAuthDetails = useAuthStore((state) => state.resetAuthDetails);

  const clearAuthState = () => {
    setIsLoggedIn(false);
    resetAuthDetails();
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("isLoggedIn");
    setAccessToken(null);
    setRefreshToken(null);
  };

  const refresh = async (): Promise<RefreshResponse | void> => {
    if (!isLoggedIn) {
      return;
    }
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) {
      clearAuthState();
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
        clearAuthState();
        return;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      clearAuthState();
      navigate("/auth/login", { state: { from: location }, replace: true });
      return;
    }
  };

  return refresh;
}
