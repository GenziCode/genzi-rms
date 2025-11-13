import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import logger from '@/utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token and tenant header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, tenant } = useAuthStore.getState();
    const startTime = performance.now();
    (config as any).metadata = { startTime };

    // Add Authorization header
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add X-Tenant header (required for protected routes)
    if (tenant && config.headers) {
      config.headers['X-Tenant'] = tenant;
    }

    return config;
  },
  (error) => {
    logger.error('api', 'request_failed', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful API call
    const duration = performance.now() - ((response.config as any).metadata?.startTime || 0);
    logger.trackApiCall(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration
    );
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken: newAccessToken } = response.data.data;

        // Update the store with new token
        useAuthStore.setState({ accessToken: newAccessToken });

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorData = error.response?.data as any;
    const message = errorData?.message || error.message || 'An error occurred';

    // Log API error
    const duration = performance.now() - ((error.config as any)?.metadata?.startTime || 0);
    logger.trackApiCall(
      error.config?.method?.toUpperCase() || 'GET',
      error.config?.url || '',
      error.response?.status || 0,
      duration
    );
    logger.error('api', 'request_error', error, {
      status: error.response?.status,
      message,
      url: error.config?.url,
    });

    // Don't show toast for certain errors (like validation errors)
    if (error.response?.status !== 400 && error.response?.status !== 422) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;

