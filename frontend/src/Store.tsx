import { create } from "zustand";
import { Role } from "./constants/roles";
import { persist } from "zustand/middleware";

interface AuthDetails {
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
  currentUserName: string; // Optional, can be used to store user's name
  setCurrentUserName: (name: string) => void; // Optional, can be used to set user's name
  resetAuthDetails: () => void;
}

export const useAuthStore = create<AuthDetails>()((set) => ({
  currentUserRole: Role.None,
  setCurrentUserRole: (role) =>
    set((state) => ({ ...state, currentUserRole: role })),
  currentUserName: "",
  setCurrentUserName: (name) =>
    set((state) => ({ ...state, currentUserName: name })),
  resetAuthDetails: () =>
    set((state) => ({
      ...state,
      currentUserRole: Role.None,
      currentUserName: "",
    })),
}));

interface UITheme {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}
export const useUITheme = create<UITheme>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name: "ui-theme", // key in storage
    }
  )
);
