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
