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
                'flex items-center gap-1 mt-2 text-sm font-medium',
                isPositive ? 'text-primary' : 'text-destructive'
              )}>
                {isPositive ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span>{Math.abs(trend)}%</span>
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
