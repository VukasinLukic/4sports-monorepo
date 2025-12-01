import { useState } from 'react';
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
          <DialogTitle>Generate Coach Invite Code</DialogTitle>
          <DialogDescription>
            Generate a unique invite code to share with a new coach. They will use
            this code to register as a coach for your club.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!inviteCode ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to generate a new invite code.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generateInviteMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {generateInviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invite Code'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Code</Label>
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
                  <p className="text-sm text-green-600">Copied to clipboard!</p>
                )}
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">Instructions for Coach:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Go to the registration page</li>
                  <li>Select "Register as Coach"</li>
                  <li>Enter this invite code: <strong>{inviteCode}</strong></li>
                  <li>Complete the registration form</li>
                </ol>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This invite code is valid for 7 days. Make
                  sure to share it with the coach before it expires.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            {inviteCode ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
