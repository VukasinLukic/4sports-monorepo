import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { MemberGrowthData } from '@/types';

interface MemberGrowthCardProps {
  data: MemberGrowthData;
}

const TrendBadge = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        isPositive
          ? 'bg-green-500/10 text-green-500'
          : 'bg-red-500/10 text-red-500'
      )}
    >
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? '+' : ''}{value}%
    </span>
  );
};

export const MemberGrowthCard = ({ data }: MemberGrowthCardProps) => {
  const { t } = useTranslation();
  const shortMonths = t('calendar.shortMonths', { returnObjects: true }) as string[];

  const chartData = data.monthlyData.map((d) => ({
    monthLabel: shortMonths[d.month - 1] || '',
    count: d.count,
    newCount: d.newCount,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('dashboard.membersCard')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {data.totalMembers}
                </span>
                <TrendBadge value={data.memberTrend} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 pl-1">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('dashboard.newMembers')}</span>
          <span className="text-sm font-semibold text-foreground">{data.newMembersThisMonth}</span>
          <TrendBadge value={data.newMembersTrend} />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {chartData.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-muted-foreground">
            <p>{t('charts.noData')}</p>
          </div>
        ) : (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [value, t('dashboard.membersCard')]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#memberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
