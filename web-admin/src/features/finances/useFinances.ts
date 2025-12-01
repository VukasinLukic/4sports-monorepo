import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { FinanceEntry, CreateFinanceEntryData, FinanceSummary } from '@/types';

// Fetch all finance entries with filters
export const useFinances = (filters?: {
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  category?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['finances', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.type && filters.type !== 'ALL') {
        params.append('type', filters.type);
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await api.get<FinanceEntry[]>(`/finances?${params.toString()}`);
      return response.data;
    },
  });
};

// Fetch finance summary stats
export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['finances-summary'],
    queryFn: async () => {
      const response = await api.get<FinanceSummary>('/finances/summary');
      return response.data;
    },
  });
};

// Create manual finance entry
export const useCreateFinanceEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFinanceEntryData) => {
      const response = await api.post<FinanceEntry>('/finances', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finances-summary'] });
    },
  });
};

// Update finance entry
export const useUpdateFinanceEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFinanceEntryData> }) => {
      const response = await api.put<FinanceEntry>(`/finances/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finances-summary'] });
    },
  });
};

// Delete finance entry (only manual entries)
export const useDeleteFinanceEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finances-summary'] });
    },
  });
};
