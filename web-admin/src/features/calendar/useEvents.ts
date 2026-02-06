import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Event {
  _id: string;
  clubId: string;
  groupId: {
    _id: string;
    name: string;
    color?: string;
  };
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  isMandatory: boolean;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  equipment?: string[];
  maxParticipants?: number;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];
    until: string;
  };
  qrCode?: string;
  createdBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  date?: string; // Alias for startTime (for calendar compatibility)
}

export interface Group {
  _id: string;
  clubId: string;
  name: string;
  description?: string;
  color?: string;
  memberCount?: number;
}

export interface CreateEventData {
  groupId: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  isMandatory?: boolean;
  notes?: string;
  equipment?: string[];
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];
    until: string;
  };
}

// Fetch all events for the club
export const useEvents = (filters?: { groupId?: string; from?: string; to?: string }) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.groupId) params.groupId = filters.groupId;
      if (filters?.from) params.from = filters.from;
      if (filters?.to) params.to = filters.to;

      const response = await api.get<{ success: boolean; data: Event[] }>('/events', { params });
      return response.data.data;
    },
  });
};

// Fetch all groups for the club
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Group[] }>('/groups');
      return response.data.data;
    },
  });
};

// Create a new event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await api.post<{ success: boolean; data: Event }>('/events', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Update an event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEventData> }) => {
      const response = await api.put<{ success: boolean; data: Event }>(`/events/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Delete an event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
