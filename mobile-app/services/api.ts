import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getIdToken, logout } from './auth';

// Get API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Firebase ID token to headers
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get Firebase ID token
      const token = await getIdToken();

      if (token && config.headers) {
        // Add token to Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url;

      console.error(`API Error: ${status} ${url}`, error.response.data);

      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        console.log('Unauthorized access - logging out user');
        try {
          await logout();
          // Navigation to login will be handled by AuthContext listener
        } catch (logoutError) {
          console.error('Logout error in interceptor:', logoutError);
        }
      }

      // Handle other error statuses
      if (status === 403) {
        console.error('Forbidden - insufficient permissions');
      } else if (status === 404) {
        console.error('Resource not found');
      } else if (status === 500) {
        console.error('Internal server error');
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error - no response from server:', error.message);
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to get error message from API response
export const getApiErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

export default api;
