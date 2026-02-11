import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuarterlyData } from '@/types';

interface RevenueByQuarterChartProps {
  data: QuarterlyData[];
}

const COLORS = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export const RevenueByQuarterChart = ({ data }: RevenueByQuarterChartProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Revenue by Quarter</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => `${props.quarter || ''} ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
              itemStyle={{
                color: 'hsl(var(--popover-foreground))',
              }}
              labelStyle={{
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
