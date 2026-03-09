import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { FinanceEntry, CreateFinanceEntryData, FinanceSummary, FinanceFilters, Group } from '@/types';
import { useGroups } from '@/features/calendar/useEvents';
import { useCoaches } from '@/features/coaches/useCoaches';

// Transform backend transaction to frontend FinanceEntry format
const transformTransaction = (transaction: any): FinanceEntry => ({
  id: transaction._id || transaction.id,
  type: transaction.type,
  category: transaction.category,
  description: transaction.description,
  amount: transaction.amount,
  date: transaction.transactionDate || transaction.date,
  recordedBy: transaction.createdBy?.fullName || 'Sistem',
  recordedById: transaction.createdBy?._id || transaction.createdBy,
  isManual: !transaction.paymentId,
  invoiceUrl: transaction.receiptUrl,
  createdAt: transaction.createdAt,
  groupId: transaction.groupId?._id || transaction.groupId,
  coachId: transaction.coachId,
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

// Fetch finance summary stats (including membership payments) - ALL TIME totals
export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['finances-summary'],
    queryFn: async () => {
      // Fetch all-time summary by passing a wide date range
      const params = new URLSearchParams();
      params.append('startDate', '2020-01-01');
      params.append('endDate', '2099-12-31');
      const response = await api.get<{ success: boolean; data: any }>(`/finances/summary?${params.toString()}`);
      const data = response.data.data || {};

      let totalIncome = data.totalIncome || 0;
      const totalExpenses = data.totalExpense || 0;

      // Also include membership payments in totals
      try {
        const paymentsResponse = await api.get<{ success: boolean; data: MembershipPayment[] }>('/payments/club');
        const payments = paymentsResponse.data.data || [];
        const membershipIncome = payments
          .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
          .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
        totalIncome += membershipIncome;
      } catch (error) {
        console.error('Failed to fetch payments for summary:', error);
      }

      const netProfit = totalIncome - totalExpenses;

      return {
        totalIncome,
        totalExpenses,
        netProfit,
        currentMonthIncome: totalIncome,
        currentMonthExpenses: totalExpenses,
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
        groupId: data.groupId || undefined,
        receiptUrl: data.invoiceUrl,
      };
      const response = await api.post<{ success: boolean; data: any }>('/finances', backendData);
      return transformTransaction(response.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finances-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-v2'] });
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
  paidAmount?: number;
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
  groupId?: {
    _id: string;
    name: string;
  } | string;
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

// Fetch filtered finances with all filters
export const useFilteredFinances = (filters: FinanceFilters) => {
  const { t } = useTranslation();
  const monthNames = t('calendar.months', { returnObjects: true }) as string[];

  return useQuery({
    queryKey: ['finances', 'filtered', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Date range
      if (filters.dateRange.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }
      if (filters.dateRange.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }

      // Transaction type
      if (filters.transactionType !== 'ALL') {
        params.append('type', filters.transactionType);
      }

      // Categories
      if (filters.categories.length > 0) {
        filters.categories.forEach((cat) => params.append('category', cat));
      }

      // Groups
      if (filters.groupIds.length > 0) {
        filters.groupIds.forEach((id) => params.append('groupId', id));
      }

      // Coaches
      if (filters.coachIds.length > 0) {
        filters.coachIds.forEach((id) => params.append('coachId', id));
      }

      const url = `/finances?${params.toString()}`;
      console.log('🔍 Fetching finances with URL:', url);
      console.log('🔍 Applied filters:', filters);

      const response = await api.get<{ success: boolean; data: any[] }>(url);
      console.log('✅ API returned transactions:', response.data.data?.length || 0);
      console.log('✅ Full API response:', response.data);

      // Transform backend data to frontend format
      let manualEntries = (response.data.data || []).map(transformTransaction);

      // Client-side filtering as fallback (in case backend doesn't support all filters)
      // Filter by date range
      if (filters.dateRange.startDate || filters.dateRange.endDate) {
        manualEntries = manualEntries.filter((entry) => {
          const entryDate = new Date(entry.date);
          if (filters.dateRange.startDate) {
            const startDate = new Date(filters.dateRange.startDate);
            if (entryDate < startDate) return false;
          }
          if (filters.dateRange.endDate) {
            const endDate = new Date(filters.dateRange.endDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            if (entryDate > endDate) return false;
          }
          return true;
        });
        console.log('🔍 After date filter:', manualEntries.length, 'transactions');
      }

      // Filter by transaction type
      if (filters.transactionType !== 'ALL') {
        manualEntries = manualEntries.filter((entry) => entry.type === filters.transactionType);
        console.log('🔍 After type filter:', manualEntries.length, 'transactions');
      }

      // Filter by categories
      if (filters.categories.length > 0) {
        manualEntries = manualEntries.filter((entry) => filters.categories.includes(entry.category));
        console.log('🔍 After category filter:', manualEntries.length, 'transactions');
      }

      // Filter by groups
      if (filters.groupIds.length > 0) {
        manualEntries = manualEntries.filter((entry) => {
          if (!entry.groupId) return false;
          return filters.groupIds.includes(entry.groupId);
        });
        console.log('🔍 After group filter:', manualEntries.length, 'transactions');
      }

      // Filter by coaches: find groups that selected coaches train, then filter by those groupIds
      let coachGroupIds: string[] = [];
      if (filters.coachIds.length > 0) {
        try {
          const groupsResponse = await api.get<{ success: boolean; data: any[] }>('/groups');
          const allGroups = groupsResponse.data.data || [];
          coachGroupIds = allGroups
            .filter((g: any) => g.coaches?.some((c: any) => {
              // coaches can be populated objects { _id, fullName } or plain IDs
              const coachId = typeof c === 'object' ? c._id : c;
              return filters.coachIds.includes(coachId);
            }))
            .map((g: any) => g._id);
          console.log('🔍 Coach filter: coaches', filters.coachIds, '=> groups', coachGroupIds);

          manualEntries = manualEntries.filter((entry) => {
            if (!entry.groupId) return false;
            return coachGroupIds.includes(entry.groupId);
          });
          console.log('🔍 After coach filter:', manualEntries.length, 'transactions');
        } catch (error) {
          console.error('Failed to fetch groups for coach filter:', error);
        }
      }

      // If showing income and membership category is included, fetch payments
      const shouldIncludePayments =
        (filters.transactionType === 'ALL' || filters.transactionType === 'INCOME') &&
        (filters.categories.length === 0 || filters.categories.includes('MEMBERSHIP_FEE'));

      if (shouldIncludePayments) {
        try {
          const paymentsResponse = await api.get<{ success: boolean; data: MembershipPayment[] }>('/payments/club');
          const payments = paymentsResponse.data.data || [];

          // Transform payments to finance entries
          const paymentEntries: FinanceEntry[] = payments
            .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
            .map((payment) => {
              const memberName = typeof payment.memberId === 'object' ? payment.memberId.fullName : 'Member';
              const amount = payment.paidAmount || payment.amount;
              const periodStr = payment.period
                ? `${monthNames[payment.period.month - 1]} ${payment.period.year}`
                : '';
              const createdByName = typeof payment.createdBy === 'object' ? payment.createdBy.fullName : 'Sistem';

              // Extract groupId from payment
              const groupId = typeof payment.groupId === 'object' ? payment.groupId._id : payment.groupId;

              return {
                id: payment._id,
                type: 'INCOME' as const,
                category: 'MEMBERSHIP_FEE',
                description: `Membership - ${memberName}${periodStr ? ` (${periodStr})` : ''}`,
                amount,
                date: payment.paidDate || payment.paymentDate || payment.createdAt,
                recordedBy: createdByName,
                isManual: false,
                createdAt: payment.createdAt,
                groupId,
              };
            });

          // Apply client-side filtering to payment entries too
          let filteredPaymentEntries = paymentEntries;

          // Filter by transaction type (payments are always INCOME)
          if (filters.transactionType === 'EXPENSE') {
            filteredPaymentEntries = []; // Exclude all payments if filtering for expenses only
            console.log('🔍 After type filter (payments): 0 payments (filtering for EXPENSE)');
          }

          // Filter by date range
          if (filters.dateRange.startDate || filters.dateRange.endDate) {
            filteredPaymentEntries = filteredPaymentEntries.filter((entry) => {
              const entryDate = new Date(entry.date);
              if (filters.dateRange.startDate) {
                const startDate = new Date(filters.dateRange.startDate);
                if (entryDate < startDate) return false;
              }
              if (filters.dateRange.endDate) {
                const endDate = new Date(filters.dateRange.endDate);
                endDate.setHours(23, 59, 59, 999); // Include the entire end date
                if (entryDate > endDate) return false;
              }
              return true;
            });
            console.log('🔍 After date filter (payments):', filteredPaymentEntries.length, 'payments');
          }

          if (filters.groupIds.length > 0 && filteredPaymentEntries.length > 0) {
            filteredPaymentEntries = filteredPaymentEntries.filter((entry) => {
              if (!entry.groupId) return false;
              return filters.groupIds.includes(entry.groupId);
            });
            console.log('🔍 After group filter (payments):', filteredPaymentEntries.length, 'payments');
          }

          // Filter payments by coach (using coach's groups)
          if (coachGroupIds.length > 0 && filteredPaymentEntries.length > 0) {
            filteredPaymentEntries = filteredPaymentEntries.filter((entry) => {
              if (!entry.groupId) return false;
              return coachGroupIds.includes(entry.groupId);
            });
            console.log('🔍 After coach filter (payments):', filteredPaymentEntries.length, 'payments');
          }

          // Merge and sort by date
          return [...manualEntries, ...filteredPaymentEntries].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        } catch (error) {
          console.error('Failed to fetch membership payments:', error);
          return manualEntries;
        }
      }

      return manualEntries;
    },
  });
};

// Map coaches to their groups
export const useCoachGroups = (): Record<string, Group[]> => {
  const { data: groups } = useGroups();
  const { data: coaches } = useCoaches();

  return useMemo(() => {
    if (!groups || !coaches) return {};

    const mapping: Record<string, Group[]> = {};
    const fullGroups = groups as Group[]; // Cast to full Group type with coaches property

    coaches.forEach((coach) => {
      mapping[coach.id] = fullGroups.filter((g) => g.coaches?.some(c => c._id === coach.id));
    });

    return mapping;
  }, [groups, coaches]);
};
