import axios from 'axios';
import { getIdToken } from './auth';
import { toast } from '@/hooks/use-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      window.location.href = '/login';
    } else if (status === 403) {
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: 'You do not have permission for this action.',
      });
    } else if (status && status >= 500) {
      toast({
        variant: 'destructive',
        title: 'Server error',
        description: 'The server is temporarily unavailable. Please try again later.',
      });
    } else if (error.code === 'ERR_NETWORK') {
      toast({
        variant: 'destructive',
        title: 'Network error',
        description: 'Please check your internet connection.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
