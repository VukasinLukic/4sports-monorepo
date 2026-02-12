import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Member, CreateMemberData } from '@/types';

// Fetch members list
export const useMembers = (filters?: {
  search?: string;
  paymentStatus?: 'PAID' | 'UNPAID' | 'ALL';
  medicalStatus?: 'VALID' | 'EXPIRED' | 'ALL';
  groupId?: string;
}) => {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
        params.append('paymentStatus', filters.paymentStatus);
      }
      if (filters?.medicalStatus && filters.medicalStatus !== 'ALL') {
        params.append('medicalStatus', filters.medicalStatus);
      }
      if (filters?.groupId) {
        params.append('groupId', filters.groupId);
      }

      const response = await api.get<{ success: boolean; data: Member[] }>(`/members?${params.toString()}`);
      console.log('✅ Members API response:', response.data);
      return response.data.data || [];
    },
  });
};

// Create member
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemberData) => {
      const response = await api.post<Member>('/members', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};

// Update member
export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMemberData> }) => {
      const response = await api.put<Member>(`/members/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberDetail'] });
      queryClient.invalidateQueries({ queryKey: ['memberByUser'] });
      queryClient.invalidateQueries({ queryKey: ['memberPayments'] });
    },
  });
};

// Delete member
export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
};
