import api from "../api";
import type { ApiResponse, Notification } from "@/types/api";

export const getUnreadNotificationCount = async (): Promise<number> => {
  const res = await api.get<ApiResponse<number>>("/api/notifications/unread-count");
  return res.data.data;
};

export const getNotifications = async (filters?: Record<string, string>): Promise<Notification[]> => {
  const res = await api.get<ApiResponse<Notification[]>>("/api/notifications", {
    params: filters,
  });
  return res.data.data;
};

export const markNotificationAsRead = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.patch<ApiResponse<{ message: string }>>(`/api/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async (): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.patch<ApiResponse<{ message: string }>>("/api/notifications/read-all");
  return res.data;
};
