import { axiosInstance } from "../api/apiConfig";
import useAuth from "./useAuth";

interface RefreshResponse {
  accessToken: string;
}

export default function useRefreshToken() {
  const { isLoggedIn, setAccessToken, setIsLoggedIn, setRefreshToken } =
    useAuth();

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
      refresh_token,
    });
    if (response.data.access) {
      const accessToken: string = response.data.access;
      setAccessToken(accessToken);

      return { accessToken };
    } else {
      console.error("Failed to refresh token");
      setIsLoggedIn(false);
      return;
    }
  };

  return refresh;
}
