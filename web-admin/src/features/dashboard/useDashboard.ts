import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DashboardStats } from '@/types';
import { FIREBASE_ENABLED } from '@/config/firebase';

// Mock data for development
const mockDashboardStats: DashboardStats = {
  currentRevenue: 125000,
  newMembersPercentage: 15.5,
  totalMembers: 245,
  totalTransactions: 1420,
  memberGrowth: [
    { month: 'Jan', count: 180 },
    { month: 'Feb', count: 195 },
    { month: 'Mar', count: 210 },
    { month: 'Apr', count: 225 },
    { month: 'May', count: 235 },
    { month: 'Jun', count: 245 },
  ],
  balanceData: {
    income: 185000,
    expense: 60000,
  },
  quarterlyRevenue: [
    { quarter: 'Q1', amount: 42000 },
    { quarter: 'Q2', amount: 38000 },
    { quarter: 'Q3', amount: 45000 },
    { quarter: 'Q4', amount: 50000 },
  ],
  monthlyFinance: [
    { month: 'Jan', revenue: 18000, expenses: 8000 },
    { month: 'Feb', revenue: 20000, expenses: 9000 },
    { month: 'Mar', revenue: 22000, expenses: 10000 },
    { month: 'Apr', revenue: 19000, expenses: 8500 },
    { month: 'May', revenue: 21000, expenses: 9500 },
    { month: 'Jun', revenue: 25000, expenses: 11000 },
  ],
};

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  if (!FIREBASE_ENABLED) {
    // Return mock data in development
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDashboardStats), 1000);
    });
  }

  const response = await api.get<DashboardStats>('/dashboard');
  return response.data;
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
  });
};
