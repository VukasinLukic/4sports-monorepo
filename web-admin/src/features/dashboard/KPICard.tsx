import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
}

export const KPICard = ({ title, value, icon: Icon, trend, suffix = '' }: KPICardProps) => {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix && <span className="text-2xl text-muted-foreground">{suffix}</span>}
            </h3>
            {trend !== undefined && (
              <div className={cn(
                'inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full',
                isPositive
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}>
                {isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>{isPositive ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon size={24} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
