import { FinanceEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface TransactionsFlatTableProps {
  transactions: FinanceEntry[] | undefined;
  onDelete?: (id: string) => void;
}

export function TransactionsFlatTable({ transactions, onDelete }: TransactionsFlatTableProps) {
  const { t } = useTranslation();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('finances.noMatchingTransactions')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('finances.adjustFilters')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-zinc-900/30 dark:bg-zinc-800/30 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('finances.date')}</TableHead>
            <TableHead>{t('finances.type')}</TableHead>
            <TableHead>{t('finances.category')}</TableHead>
            <TableHead className="max-w-xs">{t('finances.description')}</TableHead>
            <TableHead className="text-right">{t('finances.amount')}</TableHead>
            <TableHead>{t('finances.recordedBy')}</TableHead>
            <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(txn.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant={txn.type === 'INCOME' ? 'default' : 'destructive'} className={txn.type === 'INCOME' ? 'bg-green-600' : ''}>
                  {txn.type}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{txn.category.replace(/_/g, ' ')}</TableCell>
              <TableCell className="max-w-xs truncate" title={txn.description}>
                {txn.description}
              </TableCell>
              <TableCell className={`text-right font-semibold ${txn.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                {txn.type === 'INCOME' ? '+' : '-'}{txn.amount.toLocaleString()} RSD
              </TableCell>
              <TableCell className="whitespace-nowrap">{txn.recordedBy}</TableCell>
              <TableCell>
                {txn.isManual && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(txn.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
