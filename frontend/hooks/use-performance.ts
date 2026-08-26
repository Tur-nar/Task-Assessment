"use client";
import { useQuery } from "@tanstack/react-query";
import { performanceKeys } from "@/constants/query-keys";
import {
  getAllPerformance,
  getMyPerformance,
  getDepartmentPerformance,
} from "@/lib/api/performance";
import type { UserRole } from "@/types/api";

export function useAllPerformance(role: UserRole | undefined) {
  const canViewAll =
    role === "super_admin" || role === "admin" || role === "supervisor";
  return useQuery({
    queryKey: performanceKeys.list(),
    queryFn: getAllPerformance,
    enabled: canViewAll,
  });
}

export function useMyPerformance() {
  return useQuery({
    queryKey: performanceKeys.me(),
    queryFn: getMyPerformance,
  });
}

export function useDepartmentPerformance(departmentId: string | null) {
  return useQuery({
    queryKey: performanceKeys.department(departmentId ?? ""),
    queryFn: () => getDepartmentPerformance(departmentId!),
    enabled: !!departmentId,
  });
}
