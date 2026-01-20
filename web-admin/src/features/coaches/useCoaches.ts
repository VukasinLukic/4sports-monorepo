import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Coach, InviteCode } from '@/types';

// Fetch coaches list
export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Coach[] }>('/coaches');
      console.log('✅ Coaches API response:', response.data);
      return response.data.data || [];
    },
  });
};

// Generate invite code for coach
export const useGenerateCoachInvite = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<InviteCode>('/invites/generate', {
        type: 'COACH',
      });
      return response.data;
    },
  });
};

// Delete coach
export const useDeleteCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coaches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};

// Update coach contract expiry
export const useUpdateCoachContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contractExpiryDate }: { id: string; contractExpiryDate: string }) => {
      const response = await api.put<Coach>(`/coaches/${id}/contract`, {
        contractExpiryDate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });
};
