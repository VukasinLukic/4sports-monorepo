import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { InviteCode } from '@/types';

// Fetch all invite codes for the club
export const useInviteCodes = () => {
  return useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: InviteCode[] }>('/invites');
      return response.data.data || [];
    },
  });
};

// Generate a new invite code
export const useGenerateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { type: 'COACH' | 'MEMBER'; groupId?: string; maxUses?: number; expiresInDays?: number }) => {
      const response = await api.post<{ success: boolean; data: InviteCode }>('/invites/generate', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
};

// Deactivate an invite code
export const useDeactivateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      await api.delete(`/invites/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });
};
