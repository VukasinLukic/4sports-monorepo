import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
  ClubSettings,
  UpdateClubSettingsData,
  UserProfile,
  UpdateUserProfileData,
  Subscription,
} from '@/types';
import {
  mockClubSettings,
  mockUserProfile,
  mockSubscription,
} from '@/lib/mockData';

// Fetch club settings
export const useClubSettings = () => {
  return useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      try {
        const response = await api.get<ClubSettings>('/settings/club');
        return response.data;
      } catch (error) {
        console.log('Using mock data for club settings');
        return mockClubSettings;
      }
    },
  });
};

// Update club settings
export const useUpdateClubSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClubSettingsData) => {
      const response = await api.put<ClubSettings>('/settings/club', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
    },
  });
};

// Fetch user profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const response = await api.get<UserProfile>('/settings/profile');
        return response.data;
      } catch (error) {
        console.log('Using mock data for user profile');
        return mockUserProfile;
      }
    },
  });
};

// Update user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserProfileData) => {
      const response = await api.put<UserProfile>('/settings/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

// Fetch subscription info
export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const response = await api.get<Subscription>('/settings/subscription');
        return response.data;
      } catch (error) {
        console.log('Using mock data for subscription');
        return mockSubscription;
      }
    },
  });
};
