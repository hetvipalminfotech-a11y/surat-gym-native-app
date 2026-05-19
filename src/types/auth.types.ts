export type UserRole = "ADMIN" | "TRAINER" | "RECEPTIONIST";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  trainerId?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

