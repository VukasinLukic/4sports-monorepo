import { useState, useMemo } from 'react';
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
import type { PaymentMethodBreakdown } from '@/types';

interface BalanceDonutCardProps {
  data: PaymentMethodBreakdown;
}

type FilterType = 'ALL' | 'CASH' | 'CARD';

const METHOD_COLORS: Record<string, string> = {
  CASH: '#22c55e',
  CARD: '#ef4444',
};

const getMethodColor = (method: string): string => {
  return METHOD_COLORS[method] || '#f59e0b';
};

export const BalanceDonutCard = ({ data }: BalanceDonutCardProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('ALL');

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case 'CASH':
        return t('dashboard.cash');
      case 'CARD':
        return t('dashboard.credit');
      default:
        return method;
    }
  };

  const filteredMethods = useMemo(() => {
    const allowedMethods = data.methods.filter((m) => m.method === 'CASH' || m.method === 'CARD');

    if (filter === 'CASH') {
      return allowedMethods.filter((m) => m.method === 'CASH');
    }
    if (filter === 'CARD') {
      return allowedMethods.filter((m) => m.method === 'CARD');
    }
    return allowedMethods;
  }, [data.methods, filter]);

  const chartData = useMemo(() => {
    return filteredMethods.map((m) => ({
      method: m.method,
      name: getMethodLabel(m.method),
      value: Math.abs(m.balance),
      balance: m.balance,
      income: m.income,
      expense: m.expense,
      color: getMethodColor(m.method),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMethods, t]);

  const filteredTotal = useMemo(() => {
    return filteredMethods.reduce((sum, m) => sum + m.balance, 0);
  }, [filteredMethods]);

  const totalAbsolute = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {t('dashboard.balance')}
        </CardTitle>
        <Select
          value={filter}
          onValueChange={(val) => setFilter(val as FilterType)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            <SelectItem value="CASH">{t('dashboard.cash')}</SelectItem>
            <SelectItem value="CARD">{t('dashboard.credit')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 || totalAbsolute === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground">
            <p>{t('charts.noData')}</p>
          </div>
        ) : (
          <>
            <div className="relative h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(_value: number, _name: string, props: any) => {
                      const item = props.payload;
                      return [`${item.balance.toLocaleString()} RSD`, item.name];
                    }}
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t('dashboard.totalBalance')}</p>
                  <p className={`text-lg font-bold ${filteredTotal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {filteredTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">RSD</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {chartData.map((item) => {
                const percentage = totalAbsolute > 0 ? ((item.value / totalAbsolute) * 100).toFixed(1) : '0';
                return (
                  <div key={item.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {item.balance.toLocaleString()} RSD
                      </span>
                      <span className="text-muted-foreground">({percentage}%)</span>
                    </div>
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
