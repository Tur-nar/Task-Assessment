import api from "../api";
import type {
  ApiResponse, TaskStats, TaskWithRelations,
  TaskDetail,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  Subtask,
  TaskComment,
  TaskStatus,
} from "@/types/api";

export const getTaskStats = async (): Promise<TaskStats> => {
  const res = await api.get<ApiResponse<TaskStats>>("/api/tasks/stats");
  return res.data.data;
};

export const getTasks = async (
  filters?: Record<string, string>
): Promise<TaskWithRelations[]> => {
  const res = await api.get<ApiResponse<TaskWithRelations[]>>("/api/tasks", {
    params: filters,
  });
  return res.data.data;
};

export const getTask = async (id: string): Promise<TaskDetail> => {
  const res = await api.get<ApiResponse<TaskDetail>>(`/api/tasks/${id}`);
  return res.data.data;
};

export const createTask = async (
  payload: CreateTaskPayload
): Promise<ApiResponse<Task>> => {
  const res = await api.post<ApiResponse<Task>>("/api/tasks", payload);
  return res.data;
};

export const updateTask = async (
  id: string,
  payload: UpdateTaskPayload
): Promise<ApiResponse<Task>> => {
  const res = await api.put<ApiResponse<Task>>(`/api/tasks/${id}`, payload);
  return res.data;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus
): Promise<ApiResponse<null>> => {
  const res = await api.patch<ApiResponse<null>>(`/api/tasks/${id}/status`, {
    status,
  });
  return res.data;
};

export const deleteTask = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.delete<ApiResponse<{ message: string }>>(
    `/api/tasks/${id}`
  );
  return res.data;
};

// ---- Dependencies ----

export const addTaskDependency = async (
  taskId: string,
  dependsOnTaskId: string
): Promise<ApiResponse<null>> => {
  const res = await api.post<ApiResponse<null>>(`/api/tasks/${taskId}/dependencies`, {
    dependsOnTaskId,
  });
  return res.data;
};

export const removeTaskDependency = async (
  taskId: string,
  dependsOnTaskId: string
): Promise<ApiResponse<null>> => {
  const res = await api.delete<ApiResponse<null>>(
    `/api/tasks/${taskId}/dependencies/${dependsOnTaskId}`
  );
  return res.data;
};

export const getTaskBlockers = async (taskId: string): Promise<Task[]> => {
  const res = await api.get<ApiResponse<Task[]>>(`/api/tasks/${taskId}/blockers`);
  return res.data.data;
};

export const getTaskReady = async (taskId: string): Promise<boolean> => {
  const res = await api.get<ApiResponse<boolean>>(`/api/tasks/${taskId}/ready`);
  return res.data.data;
};

// ---- Subtasks ----

export const getSubtasks = async (taskId: string): Promise<{ s: Subtask }[]> => {
  const res = await api.get<ApiResponse<{ s: Subtask }[]>>(
    `/api/tasks/${taskId}/subtasks`
  );
  return res.data.data;
};

export const addSubtask = async (
  taskId: string,
  payload: { title: string; order?: number }
): Promise<ApiResponse<Subtask>> => {
  const res = await api.post<ApiResponse<Subtask>>(
    `/api/tasks/${taskId}/subtasks`,
    { title: payload.title, order: payload.order ?? 0 }
  );
  return res.data;
};

export const toggleSubtask = async (
  subtaskId: string,
  isCompleted: boolean
): Promise<ApiResponse<null>> => {
  const res = await api.patch<ApiResponse<null>>(
    `/api/tasks/subtasks/${subtaskId}`,
    { isCompleted }
  );
  return res.data;
};

export const deleteSubtask = async (
  subtaskId: string
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.delete<ApiResponse<{ message: string }>>(
    `/api/tasks/subtasks/${subtaskId}`
  );
  return res.data;
};

// ---- Comments ----

export const getTaskComments = async (
  taskId: string
): Promise<TaskComment[]> => {
  const res = await api.get<ApiResponse<TaskComment[]>>(
    `/api/tasks/${taskId}/comments`
  );
  return res.data.data;
};

export const addComment = async (
  taskId: string,
  payload: { content: string; parentCommentId?: string }
): Promise<ApiResponse<TaskComment>> => {
  const res = await api.post<ApiResponse<TaskComment>>(
    `/api/tasks/${taskId}/comments`,
    payload
  );
  return res.data;
};

export const deleteComment = async (
  taskId: string,
  commentId: string
): Promise<ApiResponse<null>> => {
  const res = await api.delete<ApiResponse<null>>(
    `/api/tasks/${taskId}/comments/${commentId}`
  );
  return res.data;
};
