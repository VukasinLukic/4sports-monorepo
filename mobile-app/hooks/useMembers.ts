import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Member, PaymentStatus } from '@/types';

interface MembersFilters {
  groupId?: string;
  paymentStatus?: PaymentStatus;
  medicalStatus?: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON';
  search?: string;
}

interface MembersResponse {
  data: Member[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fetch all members with optional filters
export function useMembers(filters?: MembersFilters) {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: async (): Promise<Member[]> => {
      const params: Record<string, string> = {};

      if (filters?.groupId) params.groupId = filters.groupId;
      if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters?.medicalStatus) params.medicalStatus = filters.medicalStatus;
      if (filters?.search) params.search = filters.search;

      const response = await api.get<MembersResponse>('/members', { params });
      return response.data.data || [];
    },
  });
}

// Fetch a single member by ID
export function useMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: async (): Promise<Member> => {
      const response = await api.get(`/members/${memberId}`);
      return response.data.data;
    },
    enabled: !!memberId,
  });
}

// Fetch member's attendance history
export function useMemberAttendance(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-attendance', memberId],
    queryFn: async () => {
      const response = await api.get(`/attendance/member/${memberId}`);
      // API returns { attendance: [...], attendanceRate: number }
      return response.data.data?.attendance || [];
    },
    enabled: !!memberId,
  });
}

// Fetch member's payment history
export function useMemberPayments(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-payments', memberId],
    queryFn: async () => {
      const response = await api.get(`/payments/member/${memberId}`);
      return response.data.data || [];
    },
    enabled: !!memberId,
  });
}

// Create a new member
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Member>) => {
      const response = await api.post('/members', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

// Update a member
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: Partial<Member> }) => {
      const response = await api.patch(`/members/${memberId}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });
    },
  });
}

// Record payment for a member
interface RecordPaymentData {
  memberId: string;
  amount: number;
  paidAmount?: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD';
  paymentDate?: string;
  note?: string;
  period?: {
    month: number;
    year: number;
  };
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordPaymentData) => {
      const response = await api.post('/payments', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['member-payments', variables.memberId] });
    },
  });
}

// Record medical check for a member
interface RecordMedicalData {
  memberId: string;
  examinationDate: string;
  note?: string;
}

export function useRecordMedical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordMedicalData) => {
      const response = await api.post('/medical-checks', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });
    },
  });
}
