import { useState, useEffect, createContext } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

// Define types for the context
interface AuthContextType {
  accessToken: string | null | undefined;
  setAccessToken: Dispatch<SetStateAction<string | null | undefined>>;
  refreshToken: string | null | undefined;
  setRefreshToken: Dispatch<SetStateAction<string | null | undefined>>;
  
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  
 
  accessToken: null,
  setAccessToken: () => {},
  refreshToken: null,
  setRefreshToken: () => {},
 
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});

// Define the props type for the provider
interface AuthProviderProps {
  children: ReactNode;
}

// Context provider component
export function AuthContextProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>();
  const [refreshToken, setRefreshToken] = useState<string | null>();
 
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    JSON.parse(localStorage.getItem("isLoggedIn") || "false")
  );

  useEffect(() => {
    localStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider
      value={{
       
        accessToken,
        setAccessToken,
        refreshToken,
        setRefreshToken,       
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
