import api from "../api";
import type { LoginPayload, ApiResponse, LoginResponse, ChangePasswordPayload, UserDetail } from "@/types/api";

export const Login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", payload);
    return res.data.data;
};

export const getMe = async (): Promise<UserDetail> => {
    const res = await api.get<ApiResponse<UserDetail>>("/api/auth/me");
    return res.data.data;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResponse<{ message: string }>> => {
    const res = await api.post<ApiResponse<{ message: string }>>("/api/auth/change-password", payload);
    return res.data;
};
