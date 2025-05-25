import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useRefreshToken from "../hooks/useRefreshToken";

export default function PersistLogin() {
  const refresh = useRefreshToken();
  const { accessToken, isLoggedIn, } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyUser() {
      if (!isLoggedIn) {
        isMounted && setLoading(false);
        return;
      }

      try {
        await refresh();
      } catch (error: any) {
        console.log(error?.response);
      } finally {
        isMounted && setLoading(false);
      }
    }

    !accessToken ? verifyUser() : setLoading(false);

    return () => {
      isMounted = false;
    };
  }, []);

  return loading ? "" : <Outlet />;
}
