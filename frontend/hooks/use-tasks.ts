"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "@/constants/query-keys";
import {
  getTaskStats,
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addTaskDependency,
  removeTaskDependency,
  getTaskBlockers,
  getTaskReady,
  getSubtasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getTaskComments,
  addComment,
  deleteComment,
} from "@/lib/api/tasks";
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
} from "@/types/api";

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

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
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

// ---- Dependencies ----

export function useAddTaskDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      dependsOnTaskId,
    }: {
      taskId: string;
      dependsOnTaskId: string;
    }) => addTaskDependency(taskId, dependsOnTaskId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
    },
  });
}

export function useRemoveTaskDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      dependsOnTaskId,
    }: {
      taskId: string;
      dependsOnTaskId: string;
    }) => removeTaskDependency(taskId, dependsOnTaskId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
    },
  });
}

export function useTaskBlockers(taskId: string | null) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId ?? ""), "blockers"],
    queryFn: () => getTaskBlockers(taskId!),
    enabled: !!taskId,
  });
}

export function useTaskReady(taskId: string | null) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId ?? ""), "ready"],
    queryFn: () => getTaskReady(taskId!),
    enabled: !!taskId,
  });
}

// ---- Subtasks ----

export function useSubtasks(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.subtasks(taskId ?? ""),
    queryFn: () => getSubtasks(taskId!),
    enabled: !!taskId,
  });
}

export function useAddSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { title: string; order?: number };
    }) => addSubtask(taskId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.subtasks(vars.taskId) });
    },
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      isCompleted,
      taskId,
    }: {
      subtaskId: string;
      isCompleted: boolean;
      taskId: string;
    }) => toggleSubtask(subtaskId, isCompleted),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.subtasks(vars.taskId) });
    },
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      taskId,
    }: {
      subtaskId: string;
      taskId: string;
    }) => deleteSubtask(subtaskId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.subtasks(vars.taskId) });
    },
  });
}

// ---- Comments ----

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.comments(taskId ?? ""),
    queryFn: () => getTaskComments(taskId!),
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { content: string; parentCommentId?: string };
    }) => addComment(taskId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(vars.taskId) });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      commentId,
    }: {
      taskId: string;
      commentId: string;
    }) => deleteComment(taskId, commentId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(vars.taskId) });
    },
  });
}
