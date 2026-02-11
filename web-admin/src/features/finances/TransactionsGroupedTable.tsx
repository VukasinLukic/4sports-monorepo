import { GroupedTransactionData, GroupByOption } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransactionsFlatTable } from './TransactionsFlatTable';

interface TransactionsGroupedTableProps {
  groupedData: GroupedTransactionData[] | null;
  groupBy: GroupByOption;
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
}

export function TransactionsGroupedTable({
  groupedData,
  expandedGroups,
  onToggleGroup,
}: TransactionsGroupedTableProps) {
  const { t } = useTranslation();

  if (!groupedData || groupedData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('finances.noMatchingTransactions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedData.map((group) => {
        const isExpanded = expandedGroups.has(group.key);

        return (
          <div key={group.key} className="rounded-lg border bg-muted/50 overflow-hidden">
            {/* Group Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => onToggleGroup(group.key)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('finances.transactionsCount', { count: group.stats.count })}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">{t('finances.filteredIncome')}</p>
                  <p className="text-lg font-semibold text-green-500">
                    {group.stats.totalIncome.toLocaleString()} RSD
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('finances.filteredExpense')}</p>
                  <p className="text-lg font-semibold text-red-500">
                    {group.stats.totalExpense.toLocaleString()} RSD
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('finances.filteredNet')}</p>
                  <p
                    className={`text-lg font-semibold ${
                      group.stats.net >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {group.stats.net >= 0 ? '+' : ''}
                    {group.stats.net.toLocaleString()} RSD
                  </p>
                </div>
              </div>
            </div>

            {/* Group Body (Transactions Table) */}
            {isExpanded && (
              <div className="border-t">
                <TransactionsFlatTable transactions={group.transactions} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
