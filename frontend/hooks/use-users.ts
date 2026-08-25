"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, departmentKeys } from "@/constants/query-keys";
import {
  getUsers,
  getUser,
  getSupervisors,
  getReportingChain,
  getTeamMembers,
  reassignSupervisor,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "@/lib/api/users";
import { getDepartments, getDepartment } from "@/lib/api/departments";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  ReassignSupervisorPayload,
} from "@/types/api";

export function useUsers(filters?: Record<string, string>) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters),
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => getUser(id!),
    enabled: !!id,
  });
}

export function useSupervisors() {
  return useQuery({
    queryKey: userKeys.supervisors(),
    queryFn: getSupervisors,
  });
}

export function useReportingChain(userId: string | null) {
  return useQuery({
    queryKey: userKeys.reportingChain(userId ?? ""),
    queryFn: () => getReportingChain(userId!),
    enabled: !!userId,
  });
}

export function useTeamMembers(supervisorId: string | null) {
  return useQuery({
    queryKey: userKeys.teamMembers(supervisorId ?? ""),
    queryFn: () => getTeamMembers(supervisorId!),
    enabled: !!supervisorId,
  });
}

export function useReassignSupervisor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReassignSupervisorPayload) =>
      reassignSupervisor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

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

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      toggleUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
