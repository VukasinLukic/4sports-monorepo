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
import { useCreateGroup, useUpdateGroup, useCoaches } from './useClubMembers';
import { useToast } from '@/hooks/use-toast';
import { Group } from '@/types';
import { Loader2, Check, X } from 'lucide-react';

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
  const { data: coaches = [] } = useCoaches();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [membershipFee, setMembershipFee] = useState('');
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);

  const isEdit = !!group;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(group?.name || '');
      setColor(group?.color || '#22c55e');
      setMembershipFee(group?.membershipFee?.toString() || '');
      setSelectedCoachIds(group?.coaches?.map(c => c._id) || []);
    }
  }, [open, group]);

  const toggleCoach = (coachId: string) => {
    setSelectedCoachIds(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const baseData = { name: name.trim(), color, coaches: selectedCoachIds };
      const dataWithFee = membershipFee ? { ...baseData, membershipFee: Number(membershipFee) } : baseData;

      if (isEdit && group) {
        await updateMutation.mutateAsync({
          id: group._id,
          data: dataWithFee,
        });
      } else {
        await createMutation.mutateAsync(dataWithFee as any);
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

          <div className="space-y-2">
            <Label>{t('profile.monthlyFee') || 'Monthly Fee (RSD)'}</Label>
            <Input
              type="number"
              value={membershipFee}
              onChange={(e) => setMembershipFee(e.target.value)}
              placeholder="3000"
              min="0"
            />
          </div>

          {/* Coach Selection */}
          <div className="space-y-2">
            <Label>{t('clubMembers.coaches')}</Label>
            {coaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('clubMembers.noCoaches')}
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {coaches.map((coach) => {
                  const isSelected = selectedCoachIds.includes(coach.id);
                  return (
                    <button
                      key={coach.id}
                      type="button"
                      onClick={() => toggleCoach(coach.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-foreground border border-primary/30'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <Check size={14} className="text-primary-foreground" />}
                      </div>
                      <span className="flex-1 text-left">{coach.fullName}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedCoachIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedCoachIds.map(id => {
                  const coach = coaches.find(c => c.id === id);
                  if (!coach) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-foreground"
                    >
                      {coach.fullName}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => toggleCoach(id)}
                      />
                    </span>
                  );
                })}
              </div>
            )}
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
