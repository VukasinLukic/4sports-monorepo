import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// ─── Types ───
export interface CoachStatsKPI {
  totalMembers: number;
  totalGroups: number;
  monthlyRevenue: number;
  monthlyExpected: number;
  unpaidThisMonth: number;
  attendanceRate: number;
  eventsThisMonth: number;
  eventsTotal: number;
  totalRevenue: number;
  collectionRate: number;
}

export interface CoachGroupPayments {
  expected: number;
  paid: number;
  paidCount: number;
  totalCount: number;
  collectionRate: number;
}

export interface CoachGroup {
  _id: string;
  name: string;
  color: string;
  ageGroup?: string;
  membershipFee: number;
  memberCount: number;
  coaches: { _id: string; fullName: string; profileImage?: string }[];
  payments: CoachGroupPayments;
}

export interface CoachAttendance {
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
}

export interface CoachUpcomingEvent {
  _id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  groupName: string;
  groupColor?: string;
  confirmedCount: number;
}

export interface CoachEvents {
  total: number;
  thisMonth: number;
  byType: Record<string, number>;
  upcoming: CoachUpcomingEvent[];
}

export interface CoachMember {
  _id: string;
  fullName: string;
  profileImage?: string;
  position?: string;
  jerseyNumber?: number;
  groupId?: string;
}

export interface CoachInfo {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  role: string;
  createdAt: string;
}

export interface CoachStatsData {
  coach: CoachInfo;
  kpi: CoachStatsKPI;
  groups: CoachGroup[];
  attendance: CoachAttendance;
  events: CoachEvents;
  members: CoachMember[];
}

// ─── Hook ───
export const useCoachStats = (coachId: string | undefined, month?: number, year?: number) => {
  return useQuery({
    queryKey: ['coachStats', coachId, month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const queryString = params.toString();
      const url = `/coaches/${coachId}/stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<{ success: boolean; data: CoachStatsData }>(url);
      return response.data.data;
    },
    enabled: !!coachId,
  });
};
