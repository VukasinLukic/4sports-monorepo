import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Member, CreateMemberData } from '@/types';
import { mockMembers } from '@/lib/mockData';

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
      try {
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

        const response = await api.get<Member[]>(`/members?${params.toString()}`);
        return response.data;
      } catch (error) {
        // Return mock data if API fails
        console.log('Using mock data for members');
        let filteredMembers = [...mockMembers];

        // Apply filters to mock data
        if (filters?.search) {
          filteredMembers = filteredMembers.filter((m) =>
            m.fullName.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
          filteredMembers = filteredMembers.filter(
            (m) => m.paymentStatus === filters.paymentStatus
          );
        }
        if (filters?.medicalStatus && filters.medicalStatus !== 'ALL') {
          filteredMembers = filteredMembers.filter(
            (m) => m.medicalStatus === filters.medicalStatus
          );
        }

        return filteredMembers;
      }
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
