"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await api.post<{ user: User; token: string }>("/api/auth/login", {
            email,
            password,
          });
          localStorage.setItem("af_token", token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { user, token } = await api.post<{ user: User; token: string }>(
            "/api/auth/register",
            { name, email, password },
          );
          localStorage.setItem("af_token", token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem("af_token");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        try {
          const { user } = await api.get<{ user: User }>("/api/auth/me");
          set({ user });
        } catch {
          set({ user: null, token: null });
          localStorage.removeItem("af_token");
        }
      },
    }),
    { name: "af_auth", partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
);
