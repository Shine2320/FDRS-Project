import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../api/apiConfig";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";

export default function useLogout() {
  const {
    setAccessToken,
    refreshToken,
    setRefreshToken,
    setIsLoggedIn,
    setUser,
  } = useAuth();
  const resetAuthDetails = useAuthStore((state) => state.resetAuthDetails);
  const navigate = useNavigate();

  const logout = async () => {
    const tokenToBlacklist = refreshToken || localStorage.getItem("refresh_token");

    try {
      if (tokenToBlacklist) {
        await axiosInstance.post("logout/", { refresh_token: tokenToBlacklist });
      }
    } catch {
      // Local logout should still complete even if the refresh token is already invalid.
    } finally {
      resetAuthDetails();
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("isLoggedIn");
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsLoggedIn(false);
      navigate("/auth/login", { replace: true });
    }
  };

  return logout;
}
