import { DollarSign, Users, TrendingUp, Receipt } from 'lucide-react';
import { useDashboard } from './useDashboard';
import { KPICard } from './KPICard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export const DashboardPage = () => {
  const { data, isLoading, error, refetch } = useDashboard();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title="Current Revenue"
              value={`$${data.currentRevenue.toLocaleString()}`}
              icon={DollarSign}
              trend={8.2}
            />
            <KPICard
              title="New Members"
              value={data.newMembersPercentage}
              icon={TrendingUp}
              trend={data.newMembersPercentage}
              suffix="%"
            />
            <KPICard
              title="Total Members"
              value={data.totalMembers}
              icon={Users}
              trend={5.1}
            />
            <KPICard
              title="Total Transactions"
              value={data.totalTransactions}
              icon={Receipt}
              trend={12.3}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
