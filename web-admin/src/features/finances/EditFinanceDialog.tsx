import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useUpdateFinanceEntry } from './useFinances';
import { useGroups } from '@/features/calendar/useEvents';
import { FinanceEntry } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditFinanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceEntry | null;
}

export function EditFinanceDialog({ open, onOpenChange, transaction }: EditFinanceDialogProps) {
  const { t } = useTranslation();
  const updateEntryMutation = useUpdateFinanceEntry();
  const { data: groups = [] } = useGroups();
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    description: '',
    amount: 0,
    date: '',
    groupId: undefined as string | undefined,
    paymentMethod: undefined as 'CASH' | 'CARD' | undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        groupId: transaction.groupId || undefined,
        paymentMethod: transaction.paymentMethod || undefined,
      });
      setErrors({});
    }
  }, [transaction]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = t('finances.validation.categoryRequired');
    }
    if (!formData.description.trim()) {
      newErrors.description = t('finances.validation.descriptionRequired');
    }
    if (formData.amount <= 0) {
      newErrors.amount = t('finances.validation.amountRequired');
    }
    if (!formData.date) {
      newErrors.date = t('finances.validation.dateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !transaction) return;

    try {
      await updateEntryMutation.mutateAsync({
        id: transaction.id,
        data: {
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          date: formData.date,
          groupId: formData.groupId,
          paymentMethod: formData.paymentMethod,
        },
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update finance entry:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update entry' });
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const incomeCategories = [
    { value: 'MEMBERSHIP_FEE', label: t('finances.categories.membershipPayment') },
    { value: 'EVENT_FEE', label: t('finances.categories.eventFee') },
    { value: 'SPONSORSHIP', label: t('finances.categories.sponsorship') },
    { value: 'EQUIPMENT', label: t('finances.categories.equipmentSales') },
    { value: 'BALANCE_ADJUSTMENT', label: t('finances.categories.balanceAdjustment') },
    { value: 'OTHER', label: t('finances.categories.otherIncome') },
  ];

  const expenseCategories = [
    { value: 'EQUIPMENT', label: t('finances.categories.equipmentPurchase') },
    { value: 'RENT', label: t('finances.categories.facilityRent') },
    { value: 'SALARY', label: t('finances.categories.coachSalary') },
    { value: 'UTILITIES', label: t('finances.categories.utilities') },
    { value: 'BALANCE_ADJUSTMENT', label: t('finances.categories.balanceAdjustment') },
    { value: 'OTHER', label: t('finances.categories.otherExpense') },
  ];

  const categories = formData.type === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('finances.editEntry')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                {t('finances.type')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  handleChange('type', value as 'INCOME' | 'EXPENSE');
                  setFormData((prev) => ({ ...prev, type: value as 'INCOME' | 'EXPENSE', category: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">{t('finances.incomeOnly')}</SelectItem>
                  <SelectItem value="EXPENSE">{t('finances.expensesOnly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">
                {t('finances.category')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Group */}
            <div className="grid gap-2">
              <Label htmlFor="group">{t('finances.group')}</Label>
              <Select
                value={formData.groupId || 'NONE'}
                onValueChange={(value) => handleChange('groupId', value === 'NONE' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t('finances.noGroup')}</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">
                {t('finances.paymentMethod')}
              </Label>
              <Select
                value={formData.paymentMethod || 'NONE'}
                onValueChange={(value) => handleChange('paymentMethod', value === 'NONE' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t('finances.noPaymentMethod')}</SelectItem>
                  <SelectItem value="CASH">{t('finances.cash')}</SelectItem>
                  <SelectItem value="CARD">{t('finances.card')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                {t('finances.amount')} (RSD) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) =>
                  handleChange('amount', e.target.value ? Number(e.target.value) : 0)
                }
                placeholder={t('finances.enterAmount')}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t('finances.description')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('finances.enterDescription')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                {t('finances.date')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            {errors.submit && (
              <p className="text-sm text-red-500">{errors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateEntryMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateEntryMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateEntryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
