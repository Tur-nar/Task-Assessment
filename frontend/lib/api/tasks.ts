import api from "../api";
import type { ApiResponse, TaskStats, TaskWithRelations, Task } from "@/types/api";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedToId: string;
  departmentId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  deadline: string;
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  assignedToId?: string;
  departmentId?: string;
  dependsOnTaskIds?: string[];
}

export const getTaskStats = async (): Promise<TaskStats> => {
  const res = await api.get<ApiResponse<TaskStats>>("/api/tasks/stats");
  return res.data.data;
};

export const getTasks = async (filters?: Record<string, string>): Promise<TaskWithRelations[]> => {
  const res = await api.get<ApiResponse<TaskWithRelations[]>>("/api/tasks", {
    params: filters,
  });
  return res.data.data;
};

export const getTask = async (id: string): Promise<TaskWithRelations> => {
  const res = await api.get<ApiResponse<TaskWithRelations>>(`/api/tasks/${id}`);
  return res.data.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<ApiResponse<Task>> => {
  const res = await api.post<ApiResponse<Task>>("/api/tasks", payload);
  return res.data;
};

export const updateTask = async (id: string, payload: UpdateTaskPayload): Promise<ApiResponse<Task>> => {
  const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${id}`, payload);
  return res.data;
};

export const deleteTask = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.delete<ApiResponse<{ message: string }>>(`/api/tasks/${id}`);
  return res.data;
};
