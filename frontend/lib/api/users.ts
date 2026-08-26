import api from "../api";
import type {
  ApiResponse,
  UserWithRelations,
  UserDetail,
  SupervisorWithTeam,
  CreateUserPayload,
  UpdateUserPayload,
  ReportingChainNode,
  ReassignSupervisorPayload,
  User,
} from "@/types/api";

export const getUsers = async (filters?: Record<string, string>): Promise<UserWithRelations[]> => {
  const res = await api.get<ApiResponse<UserWithRelations[]>>("/api/users", {
    params: filters,
  });
  return res.data.data;
};

export const getUser = async (id: string): Promise<UserDetail> => {
  const res = await api.get<ApiResponse<UserDetail>>(`/api/users/${id}`);
  return res.data.data;
};

export const getSupervisors = async (): Promise<SupervisorWithTeam[]> => {
  const res = await api.get<ApiResponse<SupervisorWithTeam[]>>("/api/users/supervisors");
  return res.data.data;
};

export const getReportingChain = async (userId: string): Promise<ReportingChainNode[]> => {
  const res = await api.get<ApiResponse<ReportingChainNode[]>>(`/api/users/${userId}/reporting-chain`);
  return res.data.data;
};

export const getTeamMembers = async (supervisorId: string): Promise<{ member: User }[]> => {
  const res = await api.get<ApiResponse<{ member: User }[]>>(`/api/users/${supervisorId}/team`);
  return res.data.data;
};

export const reassignSupervisor = async (
  payload: ReassignSupervisorPayload
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.patch<ApiResponse<{ message: string }>>("/api/users/reassign-supervisor", payload);
  return res.data;
};

export const createUser = async (payload: CreateUserPayload): Promise<ApiResponse<UserDetail>> => {
  const res = await api.post<ApiResponse<UserDetail>>("/api/users", payload);
  return res.data;
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<ApiResponse<UserDetail>> => {
  const res = await api.put<ApiResponse<UserDetail>>(`/api/users/${id}`, payload);
  return res.data;
};

export const toggleUserStatus = async (
  id: string,
  status: "active" | "inactive"
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.patch<ApiResponse<{ message: string }>>(`/api/users/${id}/status`, {
    status,
  });
  return res.data;
};

export const deleteUser = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.delete<ApiResponse<{ message: string }>>(`/api/users/${id}`);
  return res.data;
};
