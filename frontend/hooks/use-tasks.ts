"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/constants/query-keys";
import {
  getTaskStats,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from "@/lib/api/tasks";

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: getTaskStats,
  });
}

export function useTasks(filters?: Record<string, string>) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => getTasks(filters),
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ""),
    queryFn: () => getTask(id!),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
