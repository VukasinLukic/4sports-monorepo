import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { useDashboardV2 } from './useDashboard';
import { KPICard } from './KPICard';
import { QuickLinks } from './QuickLinks';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { GroupBreakdownChart } from './GroupBreakdownChart';
import { MemberGrowthCard } from './MemberGrowthCard';
import { BalanceDonutCard } from './BalanceDonutCard';
import { RecentTransactionsCard } from './RecentTransactionsCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useOnboarding } from '@/context/OnboardingContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [groupFilter, setGroupFilter] = useState<'profit' | 'income' | 'expense' | 'memberCount'>('profit');
  const { data, isLoading, error, refetch } = useDashboardV2(selectedYear);
  const { checkAndStartTutorial } = useOnboarding();

  useEffect(() => {
    if (!isLoading && data) {
      checkAndStartTutorial('dashboard');
    }
  }, [isLoading, data, checkAndStartTutorial]);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        <ErrorMessage
          message={t('errors.loadDashboard')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Compute yearly totals from monthlyFinance array
  const yearlyIncome = data?.monthlyFinance.reduce((acc, m) => acc + m.income, 0) ?? 0;
  const yearlyExpense = data?.monthlyFinance.reduce((acc, m) => acc + m.expense, 0) ?? 0;
  const yearlyProfit = yearlyIncome - yearlyExpense;

  // "Ukupno u klubu" should match "Stanje" (total balance from all payments)
  const totalBalance = data?.paymentMethodBreakdown.totalBalance ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.welcomeSubtitle')}</p>
        </div>
        {data && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{t('dashboard.totalBalance')}</span>
              <span className={`text-lg font-bold ${totalBalance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {totalBalance.toLocaleString()} RSD
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ROW 1: KPI Cards + Quick Links */}
      <div data-tour="stats-cards" className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : data ? (
            <>
              <KPICard
                title={t('dashboard.incomeCard')}
                value={`${yearlyIncome.toLocaleString()} RSD`}
                icon={TrendingUp}
                trend={data.kpiCards.incomeTrend}
              />
              <KPICard
                title={t('dashboard.expenseCard')}
                value={`${yearlyExpense.toLocaleString()} RSD`}
                icon={TrendingDown}
                trend={data.kpiCards.expenseTrend}
              />
              <KPICard
                title={t('dashboard.profitCard')}
                value={`${yearlyProfit.toLocaleString()} RSD`}
                icon={DollarSign}
                trend={data.kpiCards.profitTrend}
              />
              <KPICard
                title={t('dashboard.notPaidCard')}
                value={data.kpiCards.unpaidCount}
                icon={AlertCircle}
                trend={data.kpiCards.unpaidTrend}
              />
            </>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <QuickLinks />
        </div>
      </div>

      {/* ROW 2: Income/Expense Chart + Group Breakdown */}
      <div data-tour="charts" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[340px] w-full" />
              </CardContent>
            </Card>
          ) : data ? (
            <IncomeExpenseChart
              data={data.monthlyFinance}
              year={selectedYear}
              onYearChange={setSelectedYear}
              totalIncome={yearlyIncome}
              totalExpense={yearlyExpense}
              profit={yearlyProfit}
            />
          ) : null}
        </div>
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[340px] w-full" />
              </CardContent>
            </Card>
          ) : data ? (
            <GroupBreakdownChart
              data={data.groupStats}
              filterMode={groupFilter}
              onFilterChange={setGroupFilter}
            />
          ) : null}
        </div>
      </div>

      {/* ROW 3: Member Growth + Balance + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </>
        ) : data ? (
          <>
            <MemberGrowthCard data={data.memberGrowth} />
            <BalanceDonutCard data={data.paymentMethodBreakdown} />
            <RecentTransactionsCard
              transactions={data.recentTransactions}
              totalCount={data.totalTransactionCount}
              countTrend={data.transactionCountTrend}
            />
          </>
        ) : null}
      </div>

    </div>
  );
};
