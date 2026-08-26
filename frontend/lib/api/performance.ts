import api from "../api";
import type { ApiResponse, PerformanceRecord } from "@/types/api";

export const getAllPerformance = async (): Promise<PerformanceRecord[]> => {
  const res = await api.get<ApiResponse<PerformanceRecord[]>>("/api/performance");
  return res.data.data;
};

export const getMyPerformance = async (): Promise<PerformanceRecord> => {
  const res = await api.get<ApiResponse<PerformanceRecord>>("/api/performance/me");
  return res.data.data;
};

export const getDepartmentPerformance = async (
  departmentId: string
): Promise<PerformanceRecord[]> => {
  const res = await api.get<ApiResponse<PerformanceRecord[]>>(
    `/api/performance/department/${departmentId}`
  );
  return res.data.data;
};
