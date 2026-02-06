import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { FinanceEntry, CreateFinanceEntryData, FinanceSummary } from '@/types';

// Transform backend transaction to frontend FinanceEntry format
const transformTransaction = (transaction: any): FinanceEntry => ({
  id: transaction._id || transaction.id,
  type: transaction.type,
  category: transaction.category,
  description: transaction.description,
  amount: transaction.amount,
  date: transaction.transactionDate || transaction.date,
  recordedBy: transaction.createdBy?.fullName || transaction.createdBy?.firstName || 'Sistem',
  isManual: !transaction.paymentId,
  invoiceUrl: transaction.receiptUrl,
  createdAt: transaction.createdAt,
});

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

      const response = await api.get<{ success: boolean; data: any[] }>(`/finances?${params.toString()}`);
      console.log('✅ Finances API response:', response.data);

      // Transform backend data to frontend format
      return (response.data.data || []).map(transformTransaction);
    },
  });
};

// Fetch finance summary stats
export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['finances-summary'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>('/finances/summary');
      console.log('✅ Finance Summary API response:', response.data);

      const data = response.data.data || {};

      // Transform backend data to frontend format
      return {
        totalIncome: data.totalIncome || 0,
        totalExpenses: data.totalExpense || 0,
        netProfit: data.balance || 0,
        currentMonthIncome: data.totalIncome || 0,
        currentMonthExpenses: data.totalExpense || 0,
      } as FinanceSummary;
    },
  });
};

// Create manual finance entry
export const useCreateFinanceEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFinanceEntryData) => {
      // Transform frontend data to backend format
      const backendData = {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        transactionDate: data.date,
        receiptUrl: data.invoiceUrl,
      };
      const response = await api.post<{ success: boolean; data: any }>('/finances', backendData);
      return transformTransaction(response.data.data);
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
      // Transform frontend data to backend format
      const backendData: any = {};
      if (data.type) backendData.type = data.type;
      if (data.category) backendData.category = data.category;
      if (data.amount !== undefined) backendData.amount = data.amount;
      if (data.description) backendData.description = data.description;
      if (data.date) backendData.transactionDate = data.date;
      if (data.invoiceUrl !== undefined) backendData.receiptUrl = data.invoiceUrl;

      const response = await api.put<{ success: boolean; data: any }>(`/finances/${id}`, backendData);
      return transformTransaction(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finances-summary'] });
    },
  });
};

// Fetch membership payments from /payments/club
export interface MembershipPayment {
  _id: string;
  memberId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  } | string;
  amount: number;
  currency: string;
  type: string;
  paymentMethod?: string;
  paymentDate?: string;
  paidDate?: string;
  status: string;
  note?: string;
  description?: string;
  period?: {
    month: number;
    year: number;
  };
  createdBy: {
    _id: string;
    fullName: string;
  } | string;
  createdAt: string;
}

export const useClubPayments = () => {
  return useQuery({
    queryKey: ['club-payments'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: MembershipPayment[] }>('/payments/club');
      return response.data.data || [];
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
