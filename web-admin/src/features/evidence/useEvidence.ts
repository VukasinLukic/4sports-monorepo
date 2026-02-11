import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface EvidenceMember {
  memberId: string;
  memberName: string;
  profileImage?: string;
  group: {
    _id: string;
    name: string;
    color?: string;
  };
  period: { month: number; year: number };
  status: 'NOT_CREATED' | 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  payment?: {
    _id: string;
    amount: number;
    paidAmount?: number;
    dueDate: string;
    paidDate?: string;
    status: string;
  };
}

export interface EvidenceStats {
  total: number;
  paid: number;
  partial: number;
  pending: number;
  overdue: number;
  notCreated: number;
}

export interface MedicalEvidenceMember {
  memberId: string;
  memberName: string;
  profileImage?: string;
  group: {
    _id: string;
    name: string;
    color?: string;
  };
  medicalStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_SET';
  expiryDate?: string;
  lastCheckDate?: string;
}

export interface MedicalEvidenceStats {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  notSet: number;
}

export interface GroupWithMembers {
  _id: string;
  name: string;
  color?: string;
  members: EvidenceMember[];
  paidCount: number;
  totalCount: number;
}

export interface MedicalGroupWithMembers {
  _id: string;
  name: string;
  color?: string;
  members: MedicalEvidenceMember[];
  validCount: number;
  totalCount: number;
}

// Fetch membership evidence
export const useMembershipEvidence = (filters?: { groupId?: string; month?: number; year?: number }) => {
  return useQuery({
    queryKey: ['membership-evidence', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.groupId) params.groupId = filters.groupId;
      if (filters?.month) params.month = String(filters.month);
      if (filters?.year) params.year = String(filters.year);

      const response = await api.get<{
        success: boolean;
        data: {
          period: { month: number; year: number };
          evidence: EvidenceMember[];
          stats: EvidenceStats;
        };
      }>('/evidence/membership', { params });
      return response.data.data;
    },
  });
};

// Fetch medical evidence
export const useMedicalEvidence = (filters?: { groupId?: string }) => {
  return useQuery({
    queryKey: ['medical-evidence', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.groupId) params.groupId = filters.groupId;

      const response = await api.get<{
        success: boolean;
        data: {
          evidence: MedicalEvidenceMember[];
          stats: MedicalEvidenceStats;
        };
      }>('/evidence/medical', { params });
      return response.data.data;
    },
  });
};

// Record a payment
export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      memberId: string;
      amount: number;
      paidAmount?: number;
      paymentMethod: 'CASH' | 'BANK_TRANSFER';
      paymentDate?: string;
      note?: string;
      period?: { month: number; year: number };
    }) => {
      const response = await api.post<{ success: boolean; data: any }>('/payments', {
        memberId: data.memberId,
        type: 'MEMBERSHIP',
        amount: data.amount,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        note: data.note,
        period: data.period,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['club-payments'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Update medical info
export const useUpdateMedical = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      memberId: string;
      lastCheckDate: string;
      expiryDate: string;
    }) => {
      const response = await api.post(`/evidence/medical/${data.memberId}`, {
        lastCheckDate: data.lastCheckDate,
        expiryDate: data.expiryDate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Send payment reminder to member
export const useSendPaymentReminder = () => {
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.post(`/reminders/payment/member/${memberId}`);
      return response.data;
    },
  });
};

// Send payment reminder to all unpaid
export const useSendPaymentReminderAll = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/reminders/payment/all');
      return response.data;
    },
  });
};

// Send medical reminder to member
export const useSendMedicalReminder = () => {
  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await api.post(`/reminders/medical/member/${memberId}`);
      return response.data;
    },
  });
};

// Send medical reminder to all
export const useSendMedicalReminderAll = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/reminders/medical/all');
      return response.data;
    },
  });
};
