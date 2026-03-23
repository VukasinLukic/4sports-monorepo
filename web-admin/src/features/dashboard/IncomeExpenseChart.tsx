import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { MonthlyFinanceEntry } from '@/types';

interface IncomeExpenseChartProps {
  data: MonthlyFinanceEntry[];
  year: number;
  onYearChange: (year: number) => void;
  totalIncome?: number;
  totalExpense?: number;
  profit?: number;
}

export const IncomeExpenseChart = ({ data, year, onYearChange, totalIncome, totalExpense, profit }: IncomeExpenseChartProps) => {
  const { t } = useTranslation();
  const shortMonths = t('calendar.shortMonths', { returnObjects: true }) as string[];

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: shortMonths[d.month - 1] || '',
  }));

  const incomeLabel = t('charts.income');
  const expenseLabel = t('charts.expenses');

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {t('dashboard.incomeAndExpenses')}
        </CardTitle>
        <Select
          value={String(year)}
          onValueChange={(val) => onYearChange(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>{t('charts.noData')}</p>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} RSD`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="income"
                    name={incomeLabel}
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="expense"
                    name={expenseLabel}
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#22c55e]" />
                <span className="text-sm text-muted-foreground">{incomeLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="text-sm text-muted-foreground">{expenseLabel}</span>
              </div>
            </div>
            {totalIncome != null && totalExpense != null && profit != null && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-sm">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-muted-foreground text-xs">{t('dashboard.incomeCard')}</span>
                  <span className="font-semibold text-[#22c55e]">{totalIncome.toLocaleString()} RSD</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col items-center flex-1">
                  <span className="text-muted-foreground text-xs">{t('dashboard.expenseCard')}</span>
                  <span className="font-semibold text-[#ef4444]">{totalExpense.toLocaleString()} RSD</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col items-center flex-1">
                  <span className="text-muted-foreground text-xs">{t('dashboard.profitCard')}</span>
                  <span className={`font-semibold ${profit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString()} RSD
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
