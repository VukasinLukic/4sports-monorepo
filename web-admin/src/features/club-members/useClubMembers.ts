import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Group, CreateGroupData } from '@/types';

// Re-export existing hooks
export { useCoaches, useDeleteCoach, useGenerateCoachInvite } from '../coaches/useCoaches';
export { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from '../members/useMembers';

// Fetch all groups for the club
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Group[] }>('/groups');
      return response.data.data || [];
    },
  });
};

// Create a new group
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupData) => {
      const response = await api.post<{ success: boolean; data: Group }>('/groups', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// Update a group
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateGroupData> }) => {
      const response = await api.put<{ success: boolean; data: Group }>(`/groups/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// Delete a group
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};
