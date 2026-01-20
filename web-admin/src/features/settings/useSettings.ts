import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
  ClubSettings,
  UpdateClubSettingsData,
  UserProfile,
  UpdateUserProfileData,
  Subscription,
} from '@/types';

// Transform backend club data to frontend format
const transformClubSettings = (data: any): ClubSettings => ({
  id: data._id || data.id,
  clubName: data.name || '',
  address: data.address || '',
  phoneNumber: data.phoneNumber || '',
  email: data.email || '',
  logoUrl: data.logoUrl,
});

// Fetch club settings
export const useClubSettings = () => {
  return useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>('/settings/club');
      console.log('✅ Club Settings API response:', response.data);
      return transformClubSettings(response.data.data);
    },
  });
};

// Update club settings
export const useUpdateClubSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClubSettingsData) => {
      // Transform frontend data to backend format
      const backendData: any = {};
      if (data.clubName) backendData.name = data.clubName;
      if (data.address !== undefined) backendData.address = data.address;
      if (data.phoneNumber !== undefined) backendData.phoneNumber = data.phoneNumber;
      if (data.email !== undefined) backendData.email = data.email;

      const response = await api.put<{ success: boolean; data: any }>('/settings/club', backendData);
      return transformClubSettings(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
    },
  });
};

// Transform backend user data to frontend format
const transformUserProfile = (data: any): UserProfile => ({
  id: data._id || data.id,
  fullName: data.fullName || '',
  email: data.email || '',
  phoneNumber: data.phoneNumber || '',
  profileImage: data.profileImage,
  role: data.role === 'OWNER' ? 'ADMIN' : data.role,
});

// Fetch user profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>('/settings/profile');
      console.log('✅ User Profile API response:', response.data);
      return transformUserProfile(response.data.data);
    },
  });
};

// Update user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserProfileData) => {
      const response = await api.put<{ success: boolean; data: any }>('/settings/profile', data);
      return transformUserProfile(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

// Transform backend subscription data to frontend format
const transformSubscription = (data: any): Subscription => ({
  plan: data.plan || 'FREE',
  memberLimit: data.memberLimit || 50,
  currentMembersCount: data.currentMembers || 0,
  validUntil: data.validUntil,
});

// Fetch subscription info
export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>('/settings/subscription');
      console.log('✅ Subscription API response:', response.data);
      return transformSubscription(response.data.data);
    },
  });
};
