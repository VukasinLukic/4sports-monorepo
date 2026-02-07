import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCreateMember } from './useMembers';
import { CreateMemberData } from '@/types';
import { Loader2 } from 'lucide-react';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const { t } = useTranslation();
  const createMemberMutation = useCreateMember();
  const [formData, setFormData] = useState<CreateMemberData>({
    fullName: '',
    dateOfBirth: '',
    groupId: '',
    gender: 'MALE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('validation.dateOfBirthRequired');
    }
    if (!formData.groupId) {
      newErrors.groupId = t('validation.groupRequired');
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
      await createMemberMutation.mutateAsync(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        groupId: '',
        gender: 'MALE',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Failed to create member:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create member' });
    }
  };

  const handleChange = (field: keyof CreateMemberData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('members.addNewMember')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="fullName">
                {t('members.fullName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder={t('members.enterFullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">
                {t('members.dateOfBirth')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div className="grid gap-2">
              <Label htmlFor="gender">
                {t('members.gender')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value as 'MALE' | 'FEMALE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t('members.male')}</SelectItem>
                  <SelectItem value="FEMALE">{t('members.female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group - Mock options for now */}
            <div className="grid gap-2">
              <Label htmlFor="groupId">
                {t('members.group')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => handleChange('groupId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('members.selectGroup')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group1">U10 - Beginners</SelectItem>
                  <SelectItem value="group2">U12 - Intermediate</SelectItem>
                  <SelectItem value="group3">U14 - Advanced</SelectItem>
                  <SelectItem value="group4">U16 - Elite</SelectItem>
                </SelectContent>
              </Select>
              {errors.groupId && (
                <p className="text-sm text-red-500">{errors.groupId}</p>
              )}
            </div>

            {/* Height (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="height">{t('members.heightCm')}</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ''}
                onChange={(e) =>
                  handleChange('height', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={t('members.enterHeight')}
              />
            </div>

            {/* Weight (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="weight">{t('members.weightKg')}</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight || ''}
                onChange={(e) =>
                  handleChange('weight', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={t('members.enterWeight')}
              />
            </div>

            {/* Position (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="position">{t('members.position')}</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder={t('members.positionPlaceholder')}
              />
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
              disabled={createMemberMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.adding')}
                </>
              ) : (
                t('members.addMember')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
