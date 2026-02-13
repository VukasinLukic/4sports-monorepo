import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { AddFinanceDialog } from './AddFinanceDialog';
import { EditFinanceDialog } from './EditFinanceDialog';
import {
  useFinanceSummary,
  useFilteredFinances,
  useDeleteFinanceEntry,
} from './useFinances';
import { useGroups } from '@/features/calendar/useEvents';
import { useCoaches } from '@/features/coaches/useCoaches';
import { FinanceFilterPanel } from './FinanceFilterPanel';
import { TransactionGroupingControls } from './TransactionGroupingControls';
import { TransactionsFlatTable } from './TransactionsFlatTable';
import { TransactionsGroupedTable } from './TransactionsGroupedTable';
import {
  groupTransactionsByMonth,
  groupTransactionsByGroup,
  groupTransactionsByCategory,
  calculateGroupStats,
} from './groupingUtils';
import { FinanceEntry, FinanceFilters, GroupByOption } from '@/types';
import { useOnboarding } from '@/context/OnboardingContext';
import { useToast } from '@/hooks/use-toast';

export function FinancePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { checkAndStartTutorial } = useOnboarding();

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceEntry | null>(null);

  // Initialize filters with "This Month" by default
  const now = new Date();
  const [filters, setFilters] = useState<FinanceFilters>({
    dateRange: {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      preset: 'thisMonth',
    },
    groupIds: [],
    coachIds: [],
    transactionType: 'ALL',
    categories: [],
  });
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const { data: filteredTransactions, isLoading: transactionsLoading, isError, refetch } = useFilteredFinances(filters);
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: coaches, isLoading: coachesLoading } = useCoaches();

  const deleteEntryMutation = useDeleteFinanceEntry();

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    return calculateGroupStats(filteredTransactions || []);
  }, [filteredTransactions]);

  // Group transactions based on groupBy option
  const groupedData = useMemo(() => {
    if (!filteredTransactions || groupBy === 'none') return null;

    // Get translated month names from calendar.months (returns array of month names)
    const monthNames = t('calendar.months', { returnObjects: true }) as string[];

    // Get translated category names
    const categoryTranslations: Record<string, string> = {
      'MEMBERSHIP_FEE': t('finances.categories.membershipPayment'),
      'EVENT_FEE': t('finances.categories.eventFee'),
      'SPONSORSHIP': t('finances.categories.sponsorship'),
      'EQUIPMENT': t('finances.categories.equipmentSales'),
      'RENT': t('finances.categories.facilityRent'),
      'SALARY': t('finances.categories.coachSalary'),
      'UTILITIES': t('finances.categories.utilities'),
      'OTHER': t('finances.categories.otherExpense'),
    };

    switch (groupBy) {
      case 'month':
        return groupTransactionsByMonth(filteredTransactions, monthNames);
      case 'group':
        return groupTransactionsByGroup(filteredTransactions, groups || []);
      case 'category':
        return groupTransactionsByCategory(filteredTransactions, categoryTranslations);
      default:
        return null;
    }
  }, [filteredTransactions, groupBy, groups, t]);

  // Start tutorial on first visit
  useEffect(() => {
    if (!summaryLoading && !transactionsLoading) {
      checkAndStartTutorial('finances');
    }
  }, [summaryLoading, transactionsLoading, checkAndStartTutorial]);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteEntryMutation.mutateAsync(id);
      toast({
        title: t('common.success'),
        description: t('finances.transactionDeleted'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('finances.transactionDeleteFailed'),
        variant: 'destructive',
      });
    }
  };

  // Handle edit
  const handleEdit = (transaction: FinanceEntry) => {
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = summaryLoading || transactionsLoading || groupsLoading || coachesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-muted animate-pulse rounded" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Failed to load finances" onRetry={refetch} />;
  }

  return (
    <div className="space-y-5 mb-44">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('finances.title')}</h1>
          <p className="text-muted-foreground">{t('finances.subtitle')}</p>
        </div>
        <Button
          data-tour="add-entry"
          onClick={() => setAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('finances.addEntry')}
        </Button>
      </div>

      {/* Summary Cards - KEEP FROM ORIGINAL */}
      <div data-tour="summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.totalIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t('finances.totalIncomeDescription')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.totalExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t('finances.currentMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finances.netProfitLoss')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(summary?.netProfit || 0) >= 0 ? t('finances.profit') : t('finances.loss')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Filter Panel with Stats */}
      <FinanceFilterPanel
        filters={filters}
        onFilterChange={setFilters}
        groups={groups}
        coaches={coaches}
        stats={filteredStats}
        transactionCount={filteredTransactions?.length || 0}
      />

      {/* NEW: Grouping Controls + Date Range */}
      <div className="flex items-end gap-4 bg-muted/50 p-3 rounded-lg">
        <div className="flex-1">
          <TransactionGroupingControls groupBy={groupBy} onGroupByChange={setGroupBy} />
        </div>
        <div className="flex">
          <Label className="text-sm text-muted-foreground font-medium mt-2 mr-2">{t('finances.dateRange')}</Label>
          <DateRangePicker
            value={filters.dateRange}
            onChange={(dateRange) => setFilters({ ...filters, dateRange })}
          />
        </div>
      </div>

      {/* NEW: Transactions Display */}
      {groupBy === 'none' ? (
        <TransactionsFlatTable transactions={filteredTransactions} groups={groups} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <TransactionsGroupedTable
          groupedData={groupedData}
          groupBy={groupBy}
          expandedGroups={expandedGroups}
          onToggleGroup={(key) => {
            const next = new Set(expandedGroups);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            setExpandedGroups(next);
          }}
        />
      )}

      {/* Summary Bar */}
      {filteredTransactions && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div>
            <h3 className="font-semibold text-lg">{t('common.total')}:</h3>
            <p className="text-sm text-muted-foreground">
              {t('finances.transactionsCount', { count: filteredTransactions.length })}
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">{t('finances.filteredIncome')}</p>
              <p className="text-lg font-semibold text-green-500">
                {filteredStats.totalIncome.toLocaleString()} RSD
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('finances.filteredExpense')}</p>
              <p className="text-lg font-semibold text-red-500">
                {filteredStats.totalExpense.toLocaleString()} RSD
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('finances.filteredNet')}</p>
              <p className={`text-lg font-semibold ${filteredStats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {filteredStats.net >= 0 ? '+' : ''}{filteredStats.net.toLocaleString()} RSD
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddFinanceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditFinanceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        transaction={editingTransaction}
      />
    </div>
  );
}
