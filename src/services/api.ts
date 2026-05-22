import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, getRefreshToken, setToken, setRefreshToken } from "../storage/mmkv";
import { ApiError } from "../types/auth.types";
import { useAuthStore } from "../store/useAuthStore";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// const API = axios.create({
//   baseURL: "http://192.168.29.95:3000/api",
//   timeout: 10000,
// });
const API = axios.create({
  baseURL: "http://10.0.2.2:3000/api",
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

// Error handler with refresh token retry
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    // Check if error status is 401 and request has not already been retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          // Perform silent token refresh using a direct axios request to bypass global interceptors
          // const refreshRes = await axios.post("http://192.168.29.95:3000/api/auth/refresh", {
          //   refreshToken,
          // });
          const refreshRes = await axios.post("http://10.0.2.2:3000/api/auth/refresh", {
            refreshToken,
          });

          // Unwrap the NestJS data envelopment
          const data = refreshRes.data?.data || refreshRes.data;

          if (data?.accessToken) {
            setToken(data.accessToken);
            if (data.refreshToken) {
              setRefreshToken(data.refreshToken);
            }

            // Re-apply new token to retry request
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return API(originalRequest);
          }
        } catch (refreshError) {
          console.error("Silent token refresh failed:", refreshError);
          useAuthStore.getState().logout(); // Log out on invalid refresh session
        }
      } else {
        useAuthStore.getState().logout(); // Log out when no refresh token exists
      }

    }

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