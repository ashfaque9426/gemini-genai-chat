"use client";

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useEffect, useRef } from "react";
import useAuth from "./useAuth";
import { refreshAccessToken } from "@/lib/api/auth.api";

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

interface BackendError {
  message: string;
}

const axiosSecure = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

function useAxiosSecure() {
  const { accessSecret, setPerfLogOut, setAccessSecret } = useAuth();

  const isRefreshing = useRef(false);
  const pendingRequests = useRef<(() => void)[]>([]);

  useEffect(() => {
    const requestInterceptor = axiosSecure.interceptors.request.use(
      config => {
        if (!accessSecret) {
          const controller = new AbortController();
          controller.abort();
          config.signal = controller.signal;
          throw new axios.CanceledError("No access token available");
        }

        config.headers.Authorization = `Bearer ${accessSecret}`;
        return config;
      }
    );

    const responseInterceptor = axiosSecure.interceptors.response.use(
      res => res,
      async (error: AxiosError) => {
        if (axios.isCancel(error)) {
          console.warn("Request canceled:", error.message);
          return Promise.reject(error);
        }

        const originalRequest = error.config as AxiosRequestConfigWithRetry;
        const backendData = error.response?.data as BackendError;
        const backendMessage = backendData?.message;

        if (error.response?.status === 401 && !originalRequest._retry && backendMessage === "Authorization error. Access Token expired.") {
          originalRequest._retry = true;

          if (isRefreshing.current) {
            return new Promise(resolve => {
              pendingRequests.current.push(() =>
                resolve(axiosSecure(originalRequest))
              );
            });
          }

          isRefreshing.current = true;

          try {
            const { token, message } = await refreshAccessToken();

            if (!token) {
              throw new Error(message || "Refresh Token is not a verified refresh token or expired.");
            }

            setAccessSecret(token);

            originalRequest.headers!.Authorization = `Bearer ${token}`;

            pendingRequests.current.forEach(cb => cb());
            pendingRequests.current = [];

            return axiosSecure(originalRequest);
          } catch (err) {
            const errStr = "Refreshing Access token error occured due to invalid or expired refresh token. User Logout function executed.";
            if (err instanceof Error) {
              console.error(`${errStr} Err: ${err.message}`);
            } else {
              console.error(`${errStr} Err: `, err);
            }
            setPerfLogOut(true);
            return Promise.reject(err);
          } finally {
            isRefreshing.current = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [accessSecret, setAccessSecret, setPerfLogOut]);

  return axiosSecure;
}

export default useAxiosSecure;