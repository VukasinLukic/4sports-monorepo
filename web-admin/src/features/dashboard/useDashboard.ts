import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DashboardStats } from '@/types';
import { FIREBASE_ENABLED } from '@/config/firebase';
import { mockDashboardStats } from '@/lib/mockData';

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  if (!FIREBASE_ENABLED) {
    // Return mock data in development
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDashboardStats), 1000);
    });
  }

  try {
    const response = await api.get<DashboardStats>('/dashboard');
    return response.data;
  } catch (error) {
    // Return mock data if API fails
    console.log('Using mock data for dashboard');
    return mockDashboardStats;
  }
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
  });
};
