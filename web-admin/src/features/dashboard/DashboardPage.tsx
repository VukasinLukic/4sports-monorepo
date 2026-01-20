import { useEffect } from 'react';
import { DollarSign, Users, TrendingUp, Receipt } from 'lucide-react';
import { useDashboard } from './useDashboard';
import { KPICard } from './KPICard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { MemberGrowthChart } from '@/components/charts/MemberGrowthChart';
import { BalanceChart } from '@/components/charts/BalanceChart';
import { RevenueByQuarterChart } from '@/components/charts/RevenueByQuarterChart';
import { MonthlyFinanceChart } from '@/components/charts/MonthlyFinanceChart';
import { HelpButton } from '@/components/shared/HelpButton';
import { useOnboarding } from '@/context/OnboardingContext';

export const DashboardPage = () => {
  const { data, isLoading, error, refetch } = useDashboard();
  const { checkAndStartTutorial } = useOnboarding();

  useEffect(() => {
    if (!isLoading && data) {
      checkAndStartTutorial('dashboard');
    }
  }, [isLoading, data, checkAndStartTutorial]);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <ErrorMessage
          message="Failed to load dashboard data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your club overview.</p>
      </div>

      <div data-tour="stats-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title="Trenutni prihod"
              value={`${data.currentRevenue.toLocaleString()} RSD`}
              icon={DollarSign}
              trend={8.2}
            />
            <KPICard
              title="Novi članovi"
              value={data.newMembersPercentage}
              icon={TrendingUp}
              trend={data.newMembersPercentage}
              suffix="%"
            />
            <KPICard
              title="Ukupno članova"
              value={data.totalMembers}
              icon={Users}
              trend={5.1}
            />
            <KPICard
              title="Ukupno transakcija"
              value={data.totalTransactions}
              icon={Receipt}
              trend={12.3}
            />
          </>
        ) : null}
      </div>

      {!isLoading && data && (
        <div data-tour="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MemberGrowthChart data={data.memberGrowth} />
          <BalanceChart data={data.balanceData} />
          <RevenueByQuarterChart data={data.quarterlyRevenue} />
          <MonthlyFinanceChart data={data.monthlyFinance} />
        </div>
      )}

      <HelpButton pageKey="dashboard" />
    </div>
  );
};
