import { FinanceEntry, Group } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { format } from 'date-fns';

interface TransactionsFlatTableProps {
  transactions: FinanceEntry[] | undefined;
  groups?: Group[];
  onEdit?: (transaction: FinanceEntry) => void;
  onDelete?: (id: string) => void;
  onView?: (transaction: FinanceEntry) => void;
}

const categoryKeyMap: Record<string, string> = {
  MEMBERSHIP_FEE: 'finances.categories.membershipPayment',
  EVENT_FEE: 'finances.categories.eventFee',
  SPONSORSHIP: 'finances.categories.sponsorship',
  EQUIPMENT: 'finances.categories.equipmentSales',
  OTHER: 'finances.categories.otherIncome',
  RENT: 'finances.categories.facilityRent',
  SALARY: 'finances.categories.coachSalary',
  UTILITIES: 'finances.categories.utilities',
  BALANCE_ADJUSTMENT: 'finances.categories.balanceAdjustment',
};

export function TransactionsFlatTable({ transactions, groups, onEdit, onDelete, onView }: TransactionsFlatTableProps) {
  const { t } = useTranslation();
  const { backendUser } = useAuth();

  const translateCategory = (category: string, type: string) => {
    // For expense types, use expense-specific labels
    if (type === 'EXPENSE') {
      if (category === 'EQUIPMENT') return t('finances.categories.equipmentPurchase');
      if (category === 'OTHER') return t('finances.categories.otherExpense');
    }
    return t(categoryKeyMap[category] || category);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('finances.noMatchingTransactions')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('finances.adjustFilters')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/50 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('finances.date')}</TableHead>
            <TableHead>{t('finances.type')}</TableHead>
            <TableHead>{t('finances.category')}</TableHead>
            <TableHead className="max-w-xs">{t('finances.description')}</TableHead>
            <TableHead>{t('finances.group')}</TableHead>
            <TableHead className="text-right">{t('finances.amount')}</TableHead>
            <TableHead>{t('finances.recordedBy')}</TableHead>
            <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow
              key={txn.id}
              onClick={() => onView?.(txn)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell className="whitespace-nowrap">
                {format(new Date(txn.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant={txn.type === 'INCOME' ? 'default' : 'destructive'} className={txn.type === 'INCOME' ? 'bg-green-600' : ''}>
                  {txn.type === 'INCOME' ? t('finances.income') : t('finances.expense')}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{translateCategory(txn.category, txn.type)}</TableCell>
              <TableCell className="max-w-xs truncate" title={txn.description}>
                {txn.description}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {txn.groupId && groups
                  ? (() => {
                      const group = groups.find((g) => g._id === txn.groupId);
                      return group ? (
                        <div className="flex items-center gap-1.5">
                          {group.color && (
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                          )}
                          <span className="text-sm">{group.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                    })()
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className={`text-right font-semibold ${txn.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                {txn.type === 'INCOME' ? '+' : '-'}{txn.amount.toLocaleString()} RSD
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {txn.recordedById && backendUser?._id && txn.recordedById === backendUser._id
                  ? t('finances.you')
                  : txn.recordedBy}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {txn.isManual && (
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(txn);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(txn.id);
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
