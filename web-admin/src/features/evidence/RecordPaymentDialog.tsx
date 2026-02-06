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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Banknote, Building } from 'lucide-react';
import { useRecordPayment } from './useEvidence';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MONTHS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  month: number;
  year: number;
}

export function RecordPaymentDialog({ open, onOpenChange, memberId, memberName, month, year }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const recordPayment = useRecordPayment();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      await recordPayment.mutateAsync({
        memberId,
        amount: Number(amount),
        paymentMethod,
        note: note || `${MONTHS[month - 1]} ${year}`,
        period: { month, year },
      });

      toast({ title: 'Uspešno', description: `Uplata za ${memberName} evidentirana` });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: 'Greška', description: 'Uplata nije evidentirana', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('CASH');
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Evidentiraj uplatu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{memberName}</span>
              {' '}&mdash;{' '}{MONTHS[month - 1]} {year}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Iznos (RSD)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Način plaćanja</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  className={cn(paymentMethod === 'CASH' && 'bg-green-600 hover:bg-green-700')}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Gotovina
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'BANK_TRANSFER' ? 'default' : 'outline'}
                  className={cn(paymentMethod === 'BANK_TRANSFER' && 'bg-green-600 hover:bg-green-700')}
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Prenos
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Napomena (opciono)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Dodatna napomena..."
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={recordPayment.isPending}>
              Otkaži
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={recordPayment.isPending || !amount}>
              {recordPayment.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
              ) : (
                'Evidentiraj'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
