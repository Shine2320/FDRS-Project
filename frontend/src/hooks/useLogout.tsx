import { axiosInstance } from "../api/apiConfig";
import { Role } from "../constants/roles";
import { useAuthStore } from "../Store";
import useAuth from "./useAuth";

export default function useLogout() {
  const { setUser, setAccessToken, refreshToken, setIsLoggedIn } = useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);

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
        });
      setCurrentUserRole(Role.None);
      localStorage.clear();
      setAccessToken(null);
      setUser({});
      setIsLoggedIn(false);
    } catch (error) {
      console.log(error);
    }
  };

  return logout;
}
