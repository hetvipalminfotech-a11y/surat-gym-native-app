import API from "./api";
import { LoginResponse, RegisterResponse, ApiResponse, ApiError } from "../types/auth.types";

export const loginUser = async (
  email: string,
  password: string,
  deviceId?: string,
  devicePlatform?: string
): Promise<LoginResponse> => {
  try {
    const res = await API.post<ApiResponse<LoginResponse>>("/auth/login", {
      email,
      password,
      deviceId,
      devicePlatform,
    });

    // Unwrap NestJS global response interceptor data wrapper securely
    return res.data.data;
  } catch (error) {
    throw error as ApiError;
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    const res = await API.post<ApiResponse<RegisterResponse>>("/auth/register", {
      name,
      email,
      password,
    });

    // Unwrap NestJS global response interceptor data wrapper securely
    return res.data.data;
  } catch (error) {
    throw error as ApiError;
  }
};