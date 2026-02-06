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
import { Loader2 } from 'lucide-react';
import { useUpdateMedical } from './useEvidence';
import { useToast } from '@/hooks/use-toast';

interface RecordMedicalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function RecordMedicalDialog({ open, onOpenChange, memberId, memberName }: RecordMedicalDialogProps) {
  const { toast } = useToast();
  const updateMedical = useUpdateMedical();
  const today = toLocalDateStr(new Date());

  const [checkDate, setCheckDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return toLocalDateStr(d);
  });

  const handleCheckDateChange = (value: string) => {
    setCheckDate(value);
    // Auto-set expiry to 6 months from check date
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      const expiry = new Date(y, m - 1 + 6, d);
      setExpiryDate(toLocalDateStr(expiry));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkDate || !expiryDate) return;

    try {
      await updateMedical.mutateAsync({
        memberId,
        lastCheckDate: new Date(checkDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
      });

      toast({ title: 'Uspešno', description: `Lekarski pregled za ${memberName} ažuriran` });
      onOpenChange(false);
    } catch {
      toast({ title: 'Greška', description: 'Pregled nije ažuriran', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setCheckDate(today);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setExpiryDate(toLocalDateStr(d));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Lekarski pregled</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{memberName}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="checkDate">Datum pregleda</Label>
              <Input
                id="checkDate"
                type="date"
                value={checkDate}
                onChange={(e) => handleCheckDateChange(e.target.value)}
                max={today}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Važi do</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={checkDate}
                required
              />
              <p className="text-xs text-muted-foreground">Automatski se postavlja na 6 meseci od datuma pregleda</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateMedical.isPending}>
              Otkaži
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={updateMedical.isPending}>
              {updateMedical.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
              ) : (
                'Sačuvaj'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
