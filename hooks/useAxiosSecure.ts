"use client";

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useEffect, useRef } from "react";
import useAuth from "./useAuth";
import { refreshAccessToken } from "@/utils/utilityFunc/utilityFunc";

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

const axiosSecure = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

function useAxiosSecure() {
  const { accessSecret, logOut, setAccessSecret } = useAuth();

  const isRefreshing = useRef(false);
  const pendingRequests = useRef<(() => void)[]>([]);

  useEffect(() => {
    const requestInterceptor = axiosSecure.interceptors.request.use(
      config => {
        if (accessSecret) {
          config.headers.Authorization = `Bearer ${accessSecret}`;
        }
        return config;
      }
    );

    const responseInterceptor = axiosSecure.interceptors.response.use(
      res => res,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfigWithRetry;

        if (error.response?.status === 401 && !originalRequest._retry) {
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
            const newToken = await refreshAccessToken();
            setAccessSecret(newToken);

            originalRequest.headers!.Authorization = `Bearer ${newToken}`;

            pendingRequests.current.forEach(cb => cb());
            pendingRequests.current = [];

            return axiosSecure(originalRequest);
          } catch (err) {
            await logOut();
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
  }, [accessSecret, logOut, setAccessSecret]);

  return axiosSecure;
}

export default useAxiosSecure;