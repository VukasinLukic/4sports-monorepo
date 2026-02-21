import { useState, useEffect } from 'react';
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
import { useUpdateMember } from './useMembers';
import { useGroups } from '@/features/club-members/useClubMembers';
import { Member, CreateMemberData } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: (Member | any) | null;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
}: EditMemberDialogProps) {
  const { t } = useTranslation();
  const updateMemberMutation = useUpdateMember();
  const { data: groups = [] } = useGroups();
  const [formData, setFormData] = useState<CreateMemberData & { membershipFee?: number }>({
    fullName: '',
    dateOfBirth: '',
    groupId: '',
    gender: 'MALE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      // Extract groupId - could be string or populated object
      const groupId = typeof member.groupId === 'string'
        ? member.groupId
        : (member.groupId as any)?._id || '';

      setFormData({
        fullName: member.fullName,
        dateOfBirth: member.dateOfBirth,
        groupId: groupId,
        gender: member.gender,
        height: member.height,
        weight: member.weight,
        position: member.position,
        parentId: member.parentId,
        membershipFee: (member as any).membershipFee,
      });
    }
  }, [member]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('validation.dateOfBirthRequired');
    } else {
      // Check if date is in the future
      const selectedDate = new Date(formData.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.dateOfBirth = t('validation.birthDateCannotBeFuture') || 'Datum rodjenja ne može biti u budućnosti';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member || !validateForm()) {
      return;
    }

    try {
      const updateData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        groupId: formData.groupId || undefined,
        height: formData.height,
        weight: formData.weight,
        position: formData.position,
        membershipFee: formData.membershipFee,
      };

      await updateMemberMutation.mutateAsync({
        id: member.id,
        data: updateData,
      });
      onOpenChange(false);
      setErrors({});
    } catch (error: any) {
      console.error('Failed to update member:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update member' });
    }
  };

  const handleChange = (field: keyof (CreateMemberData & { membershipFee?: number }), value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!member) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('members.editMember')}</DialogTitle>
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
                max={new Date().toISOString().split('T')[0]}
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

            {/* Group (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="groupId">
                {t('members.group')}
              </Label>
              <Select
                value={formData.groupId || ''}
                onValueChange={(value) => handleChange('groupId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('members.selectGroup')} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Membership Fee (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="membershipFee">{t('profile.monthlyFee')}</Label>
              <Input
                id="membershipFee"
                type="number"
                value={formData.membershipFee || ''}
                onChange={(e) =>
                  handleChange('membershipFee', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="3000"
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
              disabled={updateMemberMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateMemberMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.updating')}
                </>
              ) : (
                t('members.updateMember')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
