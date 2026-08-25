import api from "../api";
import type {
  ApiResponse,
  DepartmentWithStats,
  DepartmentDetail,
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "@/types/api";

export const getDepartments = async (): Promise<DepartmentWithStats[]> => {
  const res = await api.get<ApiResponse<DepartmentWithStats[]>>("/api/departments");
  return res.data.data;
};

export const getDepartment = async (id: string): Promise<DepartmentDetail> => {
  const res = await api.get<ApiResponse<DepartmentDetail>>(`/api/departments/${id}`);
  return res.data.data;
};

export const createDepartment = async (
  payload: CreateDepartmentPayload
): Promise<ApiResponse<Department>> => {
  const res = await api.post<ApiResponse<Department>>("/api/departments", payload);
  return res.data;
};

export const updateDepartment = async (
  id: string,
  payload: UpdateDepartmentPayload
): Promise<ApiResponse<Department>> => {
  const res = await api.put<ApiResponse<Department>>(`/api/departments/${id}`, payload);
  return res.data;
};

export const deleteDepartment = async (
  id: string
): Promise<ApiResponse<{ message?: string } | null>> => {
  const res = await api.delete<ApiResponse<{ message?: string } | null>>(
    `/api/departments/${id}`
  );
  return res.data;
};
