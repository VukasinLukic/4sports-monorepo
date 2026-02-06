import { useState } from 'react';
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
import { useCreateFinanceEntry } from './useFinances';
import { CreateFinanceEntryData } from '@/types';
import { Loader2 } from 'lucide-react';

interface AddFinanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFinanceDialog({ open, onOpenChange }: AddFinanceDialogProps) {
  const createEntryMutation = useCreateFinanceEntry();
  const [formData, setFormData] = useState<CreateFinanceEntryData>({
    type: 'INCOME',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createEntryMutation.mutateAsync(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        type: 'INCOME',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    } catch (error: any) {
      console.error('Failed to create finance entry:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create entry' });
    }
  };

  const handleChange = (field: keyof CreateFinanceEntryData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Categories must match backend enum: MEMBERSHIP_FEE, EVENT_FEE, EQUIPMENT, SALARY, RENT, UTILITIES, SPONSORSHIP, OTHER
  const incomeCategories = [
    { value: 'MEMBERSHIP_FEE', label: 'Membership Payment' },
    { value: 'EVENT_FEE', label: 'Event Fee' },
    { value: 'SPONSORSHIP', label: 'Sponsorship' },
    { value: 'EQUIPMENT', label: 'Equipment Sales' },
    { value: 'OTHER', label: 'Other Income' },
  ];

  const expenseCategories = [
    { value: 'EQUIPMENT', label: 'Equipment Purchase' },
    { value: 'RENT', label: 'Facility Rent' },
    { value: 'SALARY', label: 'Coach Salary' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'OTHER', label: 'Other Expense' },
  ];

  const categories = formData.type === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Finance Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  handleChange('type', value as 'INCOME' | 'EXPENSE');
                  // Reset category when type changes
                  setFormData((prev) => ({ ...prev, category: '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Amount (RSD) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) =>
                  handleChange('amount', e.target.value ? Number(e.target.value) : 0)
                }
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
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
              disabled={createEntryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEntryMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createEntryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Entry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
