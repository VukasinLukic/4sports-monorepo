import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { GroupStatEntry } from '@/types';

type FilterMode = 'profit' | 'income' | 'expense' | 'memberCount';

interface GroupBreakdownChartProps {
  data: GroupStatEntry[];
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
}

const getValueForMode = (entry: GroupStatEntry, mode: FilterMode): number => {
  switch (mode) {
    case 'profit':
      return entry.profit;
    case 'income':
      return entry.totalIncome;
    case 'expense':
      return entry.totalExpense;
    case 'memberCount':
      return entry.memberCount;
  }
};

export const GroupBreakdownChart = ({ data, filterMode, onFilterChange }: GroupBreakdownChartProps) => {
  const { t } = useTranslation();

  const filterOptions: Array<{ value: FilterMode; label: string }> = [
    { value: 'profit', label: t('dashboard.filterByProfit') },
    { value: 'income', label: t('dashboard.filterByIncome') },
    { value: 'expense', label: t('dashboard.filterByExpense') },
    { value: 'memberCount', label: t('dashboard.filterByMembers') },
  ];

  const chartData = useMemo(() => {
    return data.map((entry) => ({
      name: entry.groupName,
      value: Math.abs(getValueForMode(entry, filterMode)),
      color: entry.groupColor || '#3b82f6',
    }));
  }, [data, filterMode]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {t('dashboard.groupBreakdown')}
        </CardTitle>
        <Select
          value={filterMode}
          onValueChange={(val) => onFilterChange(val as FilterMode)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 || total === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>{t('charts.noData')}</p>
          </div>
        ) : (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      filterMode === 'memberCount'
                        ? value
                        : `${value.toLocaleString()} RSD`,
                      '',
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {chartData.map((item) => {
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-foreground truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
