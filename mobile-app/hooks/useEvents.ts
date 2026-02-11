import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Event {
  _id: string;
  clubId: string;
  groupId: {
    _id: string;
    name: string;
    color?: string;
  } | string;
  title: string;
  description?: string;
  type: 'TRAINING' | 'MATCH' | 'OTHER';
  startTime: string;
  endTime: string;
  location?: string;
  isMandatory?: boolean;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  qrCode?: string;
  notes?: string;
  equipment?: string[];
  maxParticipants?: number;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];
    until?: string;
  };
  createdBy?: {
    _id: string;
    fullName: string;
  } | string;
  createdAt: string;
  updatedAt: string;
}

export interface EventParticipant {
  _id: string;
  eventId: string;
  memberId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  rsvpStatus?: 'CONFIRMED' | 'DECLINED' | 'PENDING';
  rsvpAt?: string;
  checkinTime?: string;
  checkinMethod?: 'QR' | 'MANUAL';
}

export interface EventParticipantsResponse {
  participants: EventParticipant[];
  stats: {
    total: number;
    confirmed: number;
    declined: number;
    pending: number;
    present: number;
    absent: number;
  };
}

interface EventsFilters {
  groupId?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  from?: string;
  to?: string;
}

// Fetch all club events with optional filters
export function useEvents(filters?: EventsFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async (): Promise<Event[]> => {
      const params: Record<string, string> = {};

      if (filters?.groupId) params.groupId = filters.groupId;
      if (filters?.status) params.status = filters.status;
      if (filters?.from) params.from = filters.from;
      if (filters?.to) params.to = filters.to;

      const response = await api.get('/events', { params });
      return response.data.data || [];
    },
  });
}

// Fetch upcoming events (today onwards)
export function useUpcomingEvents(limit?: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['events', 'upcoming', limit],
    queryFn: async (): Promise<Event[]> => {
      const response = await api.get('/events', {
        params: {
          from: today.toISOString(),
          status: 'SCHEDULED',
        },
      });
      const events = response.data.data || [];
      return limit ? events.slice(0, limit) : events;
    },
  });
}

// Fetch today's events
export function useTodayEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: ['events', 'today'],
    queryFn: async (): Promise<Event[]> => {
      const response = await api.get('/events', {
        params: {
          from: today.toISOString(),
          to: tomorrow.toISOString(),
        },
      });
      return response.data.data || [];
    },
  });
}

// Fetch a single event by ID
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<Event> => {
      const response = await api.get(`/events/${eventId}`);
      return response.data.data;
    },
    enabled: !!eventId,
  });
}

// Fetch event participants
export function useEventParticipants(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: async (): Promise<EventParticipantsResponse> => {
      const response = await api.get(`/events/${eventId}/participants`);
      return response.data.data;
    },
    enabled: !!eventId,
  });
}

// Create a new event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Event>) => {
      const response = await api.post('/events', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Update an event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: Partial<Event> }) => {
      const response = await api.patch(`/events/${eventId}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
}

// Delete an event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// RSVP to an event
export function useRsvpEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      memberId,
      rsvpStatus,
    }: {
      eventId: string;
      memberId: string;
      rsvpStatus: 'CONFIRMED' | 'DECLINED';
    }) => {
      const response = await api.post(`/events/${eventId}/confirm`, { memberId, rsvpStatus });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.eventId] });
    },
  });
}

// QR Check-in
export function useQrCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      memberId,
      qrCode,
    }: {
      eventId: string;
      memberId: string;
      qrCode: string;
    }) => {
      const response = await api.post(`/events/${eventId}/checkin`, { memberId, qrCode });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-participants', variables.eventId] });
    },
  });
}
