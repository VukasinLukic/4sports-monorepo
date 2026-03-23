import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TFunction } from 'i18next';
import type { RecentTransaction } from '@/types';

interface RecentTransactionsCardProps {
  transactions: RecentTransaction[];
  totalCount: number;
  countTrend: number;
}

function formatTimeAgo(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('dashboard.timeAgo.justNow');
  if (minutes < 60) return t('dashboard.timeAgo.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('dashboard.timeAgo.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('dashboard.timeAgo.daysAgo', { count: days });
}

function getCategoryLabel(category: string, t: TFunction): string {
  const key = `finances.categories.${category}`;
  const translated = t(key);
  // If the key doesn't resolve, return the raw category
  if (translated === key) return category;
  return translated;
}

export const RecentTransactionsCard = ({
  transactions,
  totalCount,
  countTrend,
}: RecentTransactionsCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isPositive = countTrend >= 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {t('dashboard.transactionsCard')}
              </CardTitle>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                isPositive
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              )}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{countTrend}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>{t('dashboard.noTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const dateStr = tx.transactionDate || tx.createdAt;
              const timeAgo = formatTimeAgo(dateStr, t);
              const label = tx.description || getCategoryLabel(tx.category, t);

              return (
                <div
                  key={tx._id}
                  onClick={() => navigate(`/finances?txId=${tx._id}`)}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-semibold whitespace-nowrap ml-3',
                      isIncome ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} RSD
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
