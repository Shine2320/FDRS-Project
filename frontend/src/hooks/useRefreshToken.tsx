import { jwtDecode } from "jwt-decode";
import { axiosInstance } from "../api/apiConfig";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";

interface RefreshResponse {
  accessToken: string;
}

export default function useRefreshToken() {
  const { isLoggedIn, setAccessToken, setIsLoggedIn, setRefreshToken } =
    useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);

  const refresh = async (): Promise<RefreshResponse | void> => {
    if (!isLoggedIn) {
      return;
    }
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) {
      return;
    }
    setRefreshToken(refresh_token);
    const response = await axiosInstance.post("auth/token/refresh/", {
      refresh: refresh_token,
    });
    if (response.data.access) {
      const accessToken: string = response.data.access;
      setAccessToken(accessToken);
      const decoded: any = jwtDecode(response.data.access);
      setCurrentUserRole(decoded.role);

      return { accessToken };
    } else {
      console.error("Failed to refresh token");
      setIsLoggedIn(false);
      return;
    }
  };

  return refresh;
}
