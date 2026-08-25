"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentKeys } from "@/constants/query-keys";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/api/departments";
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from "@/types/api";

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: getDepartments,
  });
}

export function useDepartment(id: string | null) {
  return useQuery({
    queryKey: departmentKeys.detail(id ?? ""),
    queryFn: () => getDepartment(id!),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      updateDepartment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}
