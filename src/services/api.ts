import axios, { AxiosError } from "axios";
import { getToken } from "../storage/mmkv";
import { ApiError } from "../types/auth.types";

const API = axios.create({
  baseURL: "http://192.168.29.95:3000/api",
  timeout: 10000,
});

// Attach token
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface NestErrorResponse {
  message?: string;
}

// Error handler
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const err: ApiError = {
      success: false,
      message:
        (error.response?.data as NestErrorResponse)?.message ||
        "Something went wrong",
      status: error.response?.status,
    };

    return Promise.reject(err);
  }
);

export default API;