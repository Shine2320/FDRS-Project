import { create } from "zustand";

interface AuthDetails {
  token: string;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthDetails>()((set) => ({
  token: "",
  setToken: (token: string) => set(() => ({ token })),
}));
