import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGenerateCoachInvite } from './useCoaches';
import { Copy, Check, Loader2 } from 'lucide-react';

interface GenerateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateInviteDialog({
  open,
  onOpenChange,
}: GenerateInviteDialogProps) {
  const { t } = useTranslation();
  const generateInviteMutation = useGenerateCoachInvite();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      const result = await generateInviteMutation.mutateAsync();
      setInviteCode(result.code);
    } catch (error: any) {
      console.error('Failed to generate invite code:', error);
    }
  };

  const handleCopyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setInviteCode(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('coaches.generateInviteTitle')}</DialogTitle>
          <DialogDescription>
            {t('coaches.generateInviteDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!inviteCode ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t('coaches.generatePrompt')}
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generateInviteMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {generateInviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.generating')}
                  </>
                ) : (
                  t('coaches.generateButton')
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('coaches.inviteCode')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCode}
                    readOnly
                    className="font-mono text-lg font-semibold"
                  />
                  <Button
                    onClick={handleCopyToClipboard}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600">{t('coaches.copiedToClipboard')}</p>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">{t('coaches.instructionsTitle')}</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>{t('coaches.instruction1')}</li>
                  <li>{t('coaches.instruction2')}</li>
                  <li>{t('coaches.instruction3')}<strong>{inviteCode}</strong></li>
                  <li>{t('coaches.instruction4')}</li>
                </ol>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{t('common.note')}:</strong> {t('coaches.inviteNote')}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            {inviteCode ? t('common.done') : t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
