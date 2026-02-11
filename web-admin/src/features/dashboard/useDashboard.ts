import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// Coach Dashboard Stats from backend
export interface CoachDashboardStats {
  totalMembers: number;
  eventsToday: number;
  unpaidCount: number;
  medicalDueCount: number;
  totalGroups: number;
  totalEvents: number;
  totalRevenue: number;
  upcomingEvents: UpcomingEvent[];
}

export interface UpcomingEvent {
  _id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  groupName: string;
  groupColor?: string;
  confirmedCount: number;
  pendingCount: number;
  totalParticipants: number;
}

// Default empty dashboard stats for new clubs
const emptyDashboardStats: CoachDashboardStats = {
  totalMembers: 0,
  eventsToday: 0,
  unpaidCount: 0,
  medicalDueCount: 0,
  totalGroups: 0,
  totalEvents: 0,
  totalRevenue: 0,
  upcomingEvents: [],
};

const fetchDashboardStats = async (): Promise<CoachDashboardStats> => {
  const response = await api.get<{ success: boolean; data: CoachDashboardStats }>('/dashboard/coach');
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

// ─── Dashboard V2 ───
import type { DashboardV2Data } from '@/types';

const emptyDashboardV2: DashboardV2Data = {
  kpiCards: {
    totalIncome: 0, totalExpense: 0, profit: 0, unpaidCount: 0,
    incomeTrend: 0, expenseTrend: 0, profitTrend: 0, unpaidTrend: 0,
  },
  monthlyFinance: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 })),
  groupStats: [],
  memberGrowth: {
    totalMembers: 0, memberTrend: 0, newMembersThisMonth: 0, newMembersTrend: 0,
    monthlyData: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0, newCount: 0 })),
  },
  paymentMethodBreakdown: { totalBalance: 0, methods: [] },
  recentTransactions: [],
  totalTransactionCount: 0,
  transactionCountTrend: 0,
};

export const useDashboardV2 = (year?: number) => {
  return useQuery({
    queryKey: ['dashboard-v2', year],
    queryFn: async (): Promise<DashboardV2Data> => {
      const params = year ? `?year=${year}` : '';
      const response = await api.get<{ success: boolean; data: DashboardV2Data }>(
        `/dashboard/coach/v2${params}`
      );
      return response.data.data || emptyDashboardV2;
    },
  });
};
