import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Post } from '@/types';

export interface DashboardStats {
  totalMembers: number;
  eventsToday: number;
  unpaidCount: number;
  medicalDueCount: number;
  totalGroups: number;
  totalEvents: number;
  totalRevenue: number;
  latestPost?: Post & { author?: { _id: string; fullName: string; profilePicture?: string } };
  upcomingEvents: {
    _id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    location?: string;
    groupName?: string;
    groupColor?: string;
    confirmedCount: number;
    declinedCount: number;
    pendingCount: number;
    totalParticipants: number;
  }[];
}

// Fetch coach dashboard stats
export function useCoachDashboard() {
  return useQuery({
    queryKey: ['coach-dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await api.get('/dashboard/coach');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}

// Fetch parent dashboard stats
export function useParentDashboard() {
  return useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async (): Promise<any> => {
      const response = await api.get('/dashboard/parent');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}
