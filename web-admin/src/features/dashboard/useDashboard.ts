import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DashboardStats } from '@/types';

// Default empty dashboard stats for new clubs
const emptyDashboardStats: DashboardStats = {
  currentRevenue: 0,
  newMembersPercentage: 0,
  totalMembers: 0,
  totalTransactions: 0,
  memberGrowth: [],
  balanceData: { income: 0, expense: 0 },
  quarterlyRevenue: [],
  monthlyFinance: [],
};

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard');
  console.log('✅ Dashboard API response:', response.data);

  // Return data or empty stats for new clubs
  return response.data.data || emptyDashboardStats;
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
  });
};
