import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
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
import { HelpButton } from '@/components/shared/HelpButton';
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcomeSubtitle')}</p>
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
                value={`${data.kpiCards.totalIncome.toLocaleString()} RSD`}
                icon={TrendingUp}
                trend={data.kpiCards.incomeTrend}
              />
              <KPICard
                title={t('dashboard.expenseCard')}
                value={`${data.kpiCards.totalExpense.toLocaleString()} RSD`}
                icon={TrendingDown}
                trend={data.kpiCards.expenseTrend}
              />
              <KPICard
                title={t('dashboard.profitCard')}
                value={`${data.kpiCards.profit.toLocaleString()} RSD`}
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

      <HelpButton pageKey="dashboard" />
    </div>
  );
};
