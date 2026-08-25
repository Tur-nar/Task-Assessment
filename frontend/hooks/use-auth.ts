"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Login } from "@/lib/api/auth";
import type { LoginPayload } from "@/types/api";

export function useAuthHydration() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useToken() {
  return useAuthStore((s) => s.token);
}

export function useRequireAuth() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  return { isAuthenticated: !!token, hydrated };
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      return await Login(payload);
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return () => {
    logout();
    router.push("/login");
  };
}
