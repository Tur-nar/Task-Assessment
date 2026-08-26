import { create } from "zustand";

interface AuthState {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,

  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    set({ token });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({ token: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }

    const token = localStorage.getItem("token");
    set({ token, hydrated: true });
  },
}));
