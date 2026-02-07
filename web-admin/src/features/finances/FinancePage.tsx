import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { AddFinanceDialog } from './AddFinanceDialog';
import { useFinances, useFinanceSummary, useDeleteFinanceEntry, useClubPayments, MembershipPayment } from './useFinances';
import { FinanceEntry } from '@/types';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Filter,
} from 'lucide-react';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { BalanceChart } from '@/components/charts/BalanceChart';
import { MonthlyFinanceChart } from '@/components/charts/MonthlyFinanceChart';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpButton } from '@/components/shared/HelpButton';
import { useOnboarding } from '@/context/OnboardingContext';

export function FinancePage() {
  const { t } = useTranslation();
  const { checkAndStartTutorial } = useOnboarding();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const { data: summary, isLoading: summaryLoading } = useFinanceSummary();
  const { data: entries, isLoading: entriesLoading, isError, refetch } = useFinances({
    type: typeFilter,
  });
  const { data: clubPayments, isLoading: paymentsLoading } = useClubPayments();
  const deleteEntryMutation = useDeleteFinanceEntry();

  const getMemberName = (payment: MembershipPayment): string => {
    if (typeof payment.memberId === 'object' && payment.memberId?.fullName) {
      return payment.memberId.fullName;
    }
    return 'Član';
  };

  const getPaymentPeriod = (payment: MembershipPayment): string => {
    if (payment.period) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
      return `${monthNames[payment.period.month - 1]} ${payment.period.year}`;
    }
    return payment.note || payment.description || 'Članarina';
  };

  const getRecordedByName = (payment: MembershipPayment): string => {
    if (typeof payment.createdBy === 'object' && payment.createdBy?.fullName) {
      return payment.createdBy.fullName;
    }
    return 'Sistem';
  };

  // Calculate total from membership payments (include PAID and PARTIAL)
  const paidPayments = (clubPayments || []).filter((p) => p.status === 'PAID' || p.status === 'PARTIAL');
  const paidPaymentsTotal = paidPayments.reduce((sum, p) => sum + (p.paidAmount ?? p.amount), 0);

  // Convert membership payments to FinanceEntry format for "All" tab
  const paymentEntries: FinanceEntry[] = paidPayments.map((p) => ({
    id: p._id,
    type: 'INCOME' as const,
    category: 'MEMBERSHIP',
    description: `Članarina - ${getMemberName(p)}${p.period ? ` (${['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec'][p.period.month - 1]} ${p.period.year})` : ''}`,
    amount: p.amount,
    date: p.paymentDate || p.paidDate || p.createdAt,
    recordedBy: getRecordedByName(p),
    isManual: false,
    createdAt: p.createdAt,
  }));

  // Merge manual entries + payment entries for "All" tab, sorted by date desc
  const allEntries = [...(entries || []), ...paymentEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Build monthly trends from all entries
  const monthlyTrends = (() => {
    const monthMap: Record<string, { revenue: number; expenses: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

    allEntries.forEach((entry) => {
      const d = new Date(entry.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { revenue: 0, expenses: 0 };
      if (entry.type === 'INCOME') {
        monthMap[key].revenue += entry.amount;
      } else {
        monthMap[key].expenses += entry.amount;
      }
    });

    return Object.keys(monthMap)
      .sort()
      .slice(-6)
      .map((key) => {
        const [, m] = key.split('-');
        return {
          month: monthNames[parseInt(m) - 1],
          revenue: monthMap[key].revenue,
          expenses: monthMap[key].expenses,
        };
      });
  })();

  // Start tutorial on first visit
  useEffect(() => {
    if (!summaryLoading && !entriesLoading) {
      checkAndStartTutorial('finances');
    }
  }, [summaryLoading, entriesLoading, checkAndStartTutorial]);

  const handleDeleteClick = (entry: FinanceEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEntry) {
      await deleteEntryMutation.mutateAsync(selectedEntry.id);
      setSelectedEntry(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (summaryLoading || entriesLoading || paymentsLoading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <SkeletonTable rows={6} columns={5} />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Failed to load finances" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finances</h1>
          <p className="text-muted-foreground">
            Manage income, expenses, and financial overview
          </p>
        </div>
        <Button
          data-tour="add-entry"
          onClick={() => setAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div data-tour="summary-cards" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency((summary?.currentMonthIncome || 0) + paidPaymentsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Ukupan prihod (uključujući članarine)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.currentMonthExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                ((summary?.netProfit || 0) + paidPaymentsTotal) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency((summary?.netProfit || 0) + paidPaymentsTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Ukupno</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div data-tour="finance-chart" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BalanceChart
          data={{
            income: (summary?.totalIncome || 0) + paidPaymentsTotal,
            expense: summary?.totalExpenses || 0,
          }}
        />
        <MonthlyFinanceChart data={monthlyTrends} />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transactions</SelectItem>
                  <SelectItem value="INCOME">Income Only</SelectItem>
                  <SelectItem value="EXPENSE">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="payments">Membership Payments</TabsTrigger>
              <TabsTrigger value="manual">Manual Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntries.length > 0 ? (
                    allEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.type === 'INCOME' ? 'default' : 'destructive'
                            }
                            className={
                              entry.type === 'INCOME'
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.category}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell
                          className={
                            entry.type === 'INCOME'
                              ? 'text-green-600 font-semibold'
                              : 'text-red-600 font-semibold'
                          }
                        >
                          {entry.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>{entry.recordedBy}</TableCell>
                        <TableCell className="text-right">
                          {entry.isManual && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(entry)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2">
                          <DollarSign className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No transactions found
                          </p>
                          <Button
                            onClick={() => setAddDialogOpen(true)}
                            variant="outline"
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Entry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Član</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Način plaćanja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Iznos</TableHead>
                    <TableHead>Evidentirao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubPayments && clubPayments.length > 0 ? (
                    clubPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          {formatDate(payment.paymentDate || payment.paidDate || payment.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getMemberName(payment)}
                        </TableCell>
                        <TableCell>{getPaymentPeriod(payment)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.paymentMethod === 'CASH' ? 'Gotovina' :
                             payment.paymentMethod === 'BANK_TRANSFER' ? 'Prenos' :
                             payment.paymentMethod === 'CARD' ? 'Kartica' :
                             payment.paymentMethod || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              payment.status === 'PAID' ? 'bg-green-600 hover:bg-green-700' :
                              payment.status === 'PARTIAL' ? 'bg-orange-500 hover:bg-orange-600' :
                              payment.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' :
                              payment.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700' :
                              'bg-gray-500'
                            }
                          >
                            {t(`finances.status.${payment.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {payment.status === 'PARTIAL'
                            ? `${formatCurrency(payment.paidAmount ?? 0)} / ${formatCurrency(payment.amount)}`
                            : `+${formatCurrency(payment.amount)}`
                          }
                        </TableCell>
                        <TableCell>{getRecordedByName(payment)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <p className="text-muted-foreground">
                          Nema evidentiranih uplata članarine
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries
                    ?.filter((e) => e.isManual)
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.type === 'INCOME' ? 'default' : 'destructive'
                            }
                            className={
                              entry.type === 'INCOME'
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.category}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell
                          className={
                            entry.type === 'INCOME'
                              ? 'text-green-600 font-semibold'
                              : 'text-red-600 font-semibold'
                          }
                        >
                          {entry.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(entry)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">
                          No manual entries found
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFinanceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Finance Entry"
        message={`Are you sure you want to delete this ${selectedEntry?.type.toLowerCase()} entry? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <HelpButton pageKey="finances" />
    </div>
  );
}
