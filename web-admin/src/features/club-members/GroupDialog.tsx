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
import { useCreateGroup, useUpdateGroup } from './useClubMembers';
import { useToast } from '@/hooks/use-toast';
import { Group } from '@/types';
import { Loader2 } from 'lucide-react';

const GROUP_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
}

export function GroupDialog({ open, onOpenChange, group }: GroupDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();

  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [color, setColor] = useState('#22c55e');

  const isEdit = !!group;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(group?.name || '');
      setAgeGroup(group?.ageGroup || '');
      setColor(group?.color || '#22c55e');
    }
  }, [open, group]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (isEdit && group) {
        await updateMutation.mutateAsync({
          id: group._id,
          data: { name: name.trim(), ageGroup: ageGroup.trim() || undefined, color },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          ageGroup: ageGroup.trim() || undefined,
          color,
        });
      }
      toast({ title: t('common.success') });
      onOpenChange(false);
    } catch {
      toast({ title: t('errors.saveFailed'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('clubMembers.editGroup') : t('clubMembers.newGroup')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('clubMembers.groupName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('clubMembers.groupNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('clubMembers.ageGroup')}</Label>
            <Input
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              placeholder={t('clubMembers.ageGroupPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('clubMembers.groupColor')}</Label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('common.save') : t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
