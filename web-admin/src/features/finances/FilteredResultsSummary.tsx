import { useTranslation } from 'react-i18next';

interface FilteredResultsSummaryProps {
  stats: {
    count: number;
    totalIncome: number;
    totalExpense: number;
    net: number;
  };
  transactionCount: number;
}

export function FilteredResultsSummary({ stats, transactionCount }: FilteredResultsSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
      <p className="text-sm text-muted-foreground">
        {t('finances.showingTransactions', { count: transactionCount })}
      </p>
      <div className="flex gap-6 items-center">
        <div>
          <p className="text-xs text-muted-foreground">{t('finances.filteredIncome')}</p>
          <p className="text-xl font-bold text-green-500">{stats.totalIncome.toLocaleString()} RSD</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('finances.filteredExpense')}</p>
          <p className="text-xl font-bold text-red-500">{stats.totalExpense.toLocaleString()} RSD</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('finances.filteredNet')}</p>
          <p className={`text-xl font-bold ${stats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()} RSD
          </p>
        </div>
      </div>
    </div>
  );
}
