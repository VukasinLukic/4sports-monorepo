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
import { useUpdateMember } from './useMembers';
import { Member, CreateMemberData } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
}: EditMemberDialogProps) {
  const updateMemberMutation = useUpdateMember();
  const [formData, setFormData] = useState<CreateMemberData>({
    fullName: '',
    dateOfBirth: '',
    groupId: '',
    gender: 'MALE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        dateOfBirth: member.dateOfBirth,
        groupId: member.groupId,
        gender: member.gender,
        height: member.height,
        weight: member.weight,
        position: member.position,
        parentId: member.parentId,
      });
    }
  }, [member]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.groupId) {
      newErrors.groupId = 'Group is required';
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
      await updateMemberMutation.mutateAsync({
        id: member.id,
        data: formData,
      });
      onOpenChange(false);
      setErrors({});
    } catch (error: any) {
      console.error('Failed to update member:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update member' });
    }
  };

  const handleChange = (field: keyof CreateMemberData, value: any) => {
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
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-red-500">*</span>
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
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value as 'MALE' | 'FEMALE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group */}
            <div className="grid gap-2">
              <Label htmlFor="groupId">
                Group <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => handleChange('groupId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
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
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ''}
                onChange={(e) =>
                  handleChange('height', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Enter height"
              />
            </div>

            {/* Weight (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight || ''}
                onChange={(e) =>
                  handleChange('weight', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Enter weight"
              />
            </div>

            {/* Position (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="e.g., Forward, Defender, Goalkeeper"
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMemberMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
