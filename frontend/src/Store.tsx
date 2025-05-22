import { create } from "zustand";
import { Role } from "./constants/roles";
import { persist } from "zustand/middleware";

interface AuthDetails {
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
}

export const useAuthStore = create<AuthDetails>()((set) => ({
  currentUserRole: Role.None,
  setCurrentUserRole: (role) =>
    set((state) => ({ ...state, currentUserRole: role })),
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
