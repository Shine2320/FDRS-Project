import { create } from "zustand";
import { Role } from "./constants/roles";

interface AuthDetails {
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
}

export const useAuthStore = create<AuthDetails>()((set) => ({
  currentUserRole: Role.None,
  setCurrentUserRole: (role) =>
    set((state) => ({ ...state, currentUserRole: role })),
}));
