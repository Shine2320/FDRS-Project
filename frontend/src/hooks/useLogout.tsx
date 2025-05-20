import { axiosInstance } from "../api/apiConfig";
import useAuth from "./useAuth";

export default function useLogout() {
  const { setUser, setAccessToken, refreshToken, setIsLoggedIn } = useAuth();

  const logout = async () => {
    try {
      await axiosInstance.post("logout/", { refresh_token: refreshToken });
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
