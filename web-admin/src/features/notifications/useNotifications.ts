import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface NotificationSender {
  _id: string;
  fullName: string;
  profilePicture?: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: NotificationSender;
  data?: Record<string, any>;
}

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications?limit=10');
      return response.data.data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread/count');
      return response.data.data.count || 0;
    },
    refetchInterval: 10000, // Check every 10 seconds instead of 30
    staleTime: 5000, // Mark as stale after 5 seconds
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};
