"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Login, getMe } from "@/lib/api/auth";
import { authKeys } from "@/constants/query-keys";
import { toast } from "sonner";
import type { LoginPayload, UserDetail } from "@/types/api";

export function useAuthHydration() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}

export function useToken() {
  return useAuthStore((s) => s.token);
}

export function useCurrentUser() {
  const token = useToken();
  const hydrated = useAuthHydration();

  return useQuery<UserDetail>({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: hydrated && !!token,
    staleTime: 20 * 60 * 1000, // 20 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 1;
    },
  });
}

export function useRequireAuth() {
  const router = useRouter();
  const hydrated = useAuthHydration();
  const token = useToken();
  const query = useCurrentUser();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    if (hydrated && token && query.isError) {
      const logout = useAuthStore.getState().logout;
      logout();
      router.replace("/login");
    }
  }, [hydrated, token, query.isError, router]);

  return {
    isAuthenticated: !!token && !query.isError && !!query.data,
    isLoading: !hydrated || (!!token && query.isLoading),
    user: query.data ?? null,
    hydrated,
  };
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      return await Login(payload);
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(authKeys.me(), data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    logout();
    queryClient.removeQueries({ queryKey: authKeys.all });
    toast.info("Logged out successfully");
    router.push("/login");
  };
}
