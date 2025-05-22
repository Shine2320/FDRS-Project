import { useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../api/apiConfig";
import { Role } from "../constants/roles";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";

export default function useLogout() {
  const { setUser, setAccessToken, refreshToken, setIsLoggedIn } = useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);
  const location = useLocation();
  const navigate = useNavigate();
  const fromLocation =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  const logout = async () => {
    try {
      await axiosInstance
        .post("logout/", { refresh_token: refreshToken })
        .catch(() => {
          setCurrentUserRole(Role.None);
          localStorage.clear();
          setAccessToken(null);
          setUser({});
          setIsLoggedIn(false);
          navigate(fromLocation, { replace: true });
        });
      setCurrentUserRole(Role.None);
      localStorage.clear();
      setAccessToken(null);
      setUser({});
      setIsLoggedIn(false);
      navigate(fromLocation, { replace: true });
    } catch (error) {
      console.log(error);
    }
  };

  return logout;
}
