import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { FinanceEntry } from '@/types';
import { Pencil, Trash2, Calendar, Tag, FileText, DollarSign, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceEntry | null;
  onEdit: () => void;
  onDelete: () => void;
  groupName?: string;
}

export function ViewTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onEdit,
  onDelete,
  groupName,
}: ViewTransactionDialogProps) {
  const { t } = useTranslation();

  if (!transaction) return null;

  const isIncome = transaction.type === 'INCOME';

  // Map category to translation key
  const getCategoryLabel = () => {
    const categoryMap: Record<string, string> = {
      'MEMBERSHIP_FEE': 'finances.categories.membershipPayment',
      'EVENT_FEE': 'finances.categories.eventFee',
      'SPONSORSHIP': 'finances.categories.sponsorship',
      'EQUIPMENT': isIncome ? 'finances.categories.equipmentSales' : 'finances.categories.equipmentPurchase',
      'RENT': 'finances.categories.facilityRent',
      'SALARY': 'finances.categories.coachSalary',
      'UTILITIES': 'finances.categories.utilities',
      'BALANCE_ADJUSTMENT': 'finances.categories.balanceAdjustment',
      'OTHER': isIncome ? 'finances.categories.otherIncome' : 'finances.categories.otherExpense',
    };
    const key = categoryMap[transaction.category] || transaction.category;
    return t(key);
  };

  const categoryLabel = getCategoryLabel();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full",
              isIncome ? "bg-green-500/10" : "bg-red-500/10"
            )}>
              <DollarSign className={cn(
                "h-5 w-5",
                isIncome ? "text-green-500" : "text-red-500"
              )} />
            </div>
            <span>{t('finances.transactionDetails')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount - prominent display */}
          <div className="flex items-center justify-center py-6 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {isIncome ? t('finances.incomeOnly') : t('finances.expensesOnly')}
              </p>
              <p className={cn(
                "text-4xl font-bold",
                isIncome ? "text-green-500" : "text-red-500"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            {/* Description */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t('finances.description')}</p>
                <p className="text-base font-medium">{transaction.description}</p>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t('finances.category')}</p>
                <p className="text-base font-medium">{categoryLabel}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t('finances.date')}</p>
                <p className="text-base font-medium">
                  {formatDate(transaction.date || transaction.createdAt)}
                </p>
              </div>
            </div>

            {/* Group (if applicable) */}
            {groupName && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('finances.group')}</p>
                  <p className="text-base font-medium">{groupName}</p>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t('finances.paymentMethod')}</p>
                <p className="text-base font-medium">
                  {transaction.paymentMethod === 'CASH'
                    ? t('finances.cash')
                    : transaction.paymentMethod === 'CARD'
                      ? t('finances.card')
                      : t('finances.noPaymentMethod')}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {t('finances.createdAt')}: {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="bg-green-600 hover:bg-green-700"
          >
            <Pencil className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
