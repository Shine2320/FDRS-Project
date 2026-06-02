import { axiosPrivateInstance } from "../api/apiConfig";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import useAuth from "./useAuth";
import axios from "axios";

export default function useAxiosPrivate() {
  const { accessToken, setAccessToken } = useAuth();
  const refresh = useRefreshToken();

  useEffect(() => {
    const requestIntercept = axiosPrivateInstance.interceptors.request.use(
      async (config) => {
        let token = accessToken;

        if (!token) {
          const refreshed = await refresh();
          token = refreshed?.accessToken;
          if (token) {
            setAccessToken(token);
          }
        }

        const authorization = config.headers["Authorization"];
        const hasInvalidAuthorization =
          authorization === "Bearer undefined" || authorization === "Bearer null";

        if (token && (!authorization || hasInvalidAuthorization)) {
          config.headers["Authorization"] = `Bearer ${token}`;
        } else if (!token && hasInvalidAuthorization) {
          delete config.headers["Authorization"];
        }

        if (!token) {
          return Promise.reject(
            new axios.CanceledError("Private request cancelled: no access token")
          );
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivateInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (
          (error?.response?.status === 403 ||
            error?.response?.status === 401) &&
          !prevRequest?.sent
        ) {
          prevRequest.sent = true;
          const { accessToken: newAccessToken } = (await refresh()) ?? {};
          if (newAccessToken) {
            setAccessToken(newAccessToken);
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivateInstance(prevRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivateInstance.interceptors.request.eject(requestIntercept);
      axiosPrivateInstance.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken, refresh, setAccessToken]);

  return axiosPrivateInstance;
}
