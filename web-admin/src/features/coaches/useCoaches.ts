import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Coach, InviteCode } from '@/types';
import { mockCoaches } from '@/lib/mockData';

// Fetch coaches list
export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      try {
        const response = await api.get<Coach[]>('/coaches');
        return response.data;
      } catch (error) {
        // Return mock data if API fails
        console.log('Using mock data for coaches');
        return mockCoaches;
      }
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
