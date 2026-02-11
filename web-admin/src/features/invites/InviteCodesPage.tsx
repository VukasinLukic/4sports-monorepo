import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useInviteCodes, useGenerateInvite, useDeactivateInvite } from './useInvites';
import { useGroups } from '../club-members/useClubMembers';
import { InviteCode } from '@/types';
import {
  Copy,
  Check,
  Share2,
  Loader2,
  Ticket,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InviteCodesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showExpiredCoach, setShowExpiredCoach] = useState(false);
  const [showExpiredMember, setShowExpiredMember] = useState(false);
  const [deactivateCode, setDeactivateCode] = useState<string | null>(null);

  const { data: inviteCodes, isLoading: codesLoading } = useInviteCodes();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const generateMutation = useGenerateInvite();
  const deactivateMutation = useDeactivateInvite();

  const selectedGroup = groups?.find((g) => g._id === selectedGroupId) || null;

  // Split codes by type and validity
  const { coachValid, coachInvalid, memberValid, memberInvalid } = useMemo(() => {
    if (!inviteCodes) return { coachValid: [], coachInvalid: [], memberValid: [], memberInvalid: [] };
    const cValid: InviteCode[] = [];
    const cInvalid: InviteCode[] = [];
    const mValid: InviteCode[] = [];
    const mInvalid: InviteCode[] = [];

    inviteCodes.forEach((inv) => {
      const isValid = inv.isValid && inv.isActive;
      if (inv.type === 'COACH') {
        (isValid ? cValid : cInvalid).push(inv);
      } else {
        (isValid ? mValid : mInvalid).push(inv);
      }
    });

    return { coachValid: cValid, coachInvalid: cInvalid, memberValid: mValid, memberInvalid: mInvalid };
  }, [inviteCodes]);

  // Find existing valid code for selected group (member codes only)
  const existingCodeForGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return memberValid.find(
      (inv) =>
        inv.groupId &&
        (typeof inv.groupId === 'string' ? inv.groupId : inv.groupId._id) === selectedGroupId
    ) || null;
  }, [selectedGroupId, memberValid]);

  // Find existing valid coach code
  const existingCoachCode = useMemo(() => {
    return coachValid.length > 0 ? coachValid[0] : null;
  }, [coachValid]);

  const getInviteMessage = (code: string, groupName?: string) => {
    const lines = [`${t('invites.joinClubMessage')}\n`];
    if (groupName) lines.push(`${t('members.group')}: ${groupName}`);
    lines.push(`${t('invites.inviteCode')}: ${code}\n`);
    lines.push(`1. ${t('invites.step1')}`);
    lines.push(`2. ${t('invites.step2')}`);
    lines.push(`3. ${t('invites.step3')}: ${code}`);
    lines.push(`4. ${t('invites.step4')}`);
    return lines.join('\n');
  };

  const handleCopy = async (code: string, groupName?: string) => {
    const message = getInviteMessage(code, groupName);
    await navigator.clipboard.writeText(message);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: t('invites.codeCopied'), description: t('invites.messageCopied') });
  };

  const handleShare = async (code: string, groupName?: string) => {
    const message = getInviteMessage(code, groupName);
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopy(code, groupName);
    }
  };

  const handleGenerateCoach = async () => {
    try {
      await generateMutation.mutateAsync({
        type: 'COACH',
        maxUses: 1,
        expiresInDays: 7,
      });
      toast({ title: t('invites.codeGenerated') });
    } catch {
      toast({ title: t('invites.generateFailed'), variant: 'destructive' });
    }
  };

  const handleGenerateMember = async () => {
    if (!selectedGroupId) return;
    try {
      await generateMutation.mutateAsync({
        type: 'MEMBER',
        groupId: selectedGroupId,
        maxUses: 30,
        expiresInDays: 30,
      });
      toast({ title: t('invites.codeGenerated') });
    } catch {
      toast({ title: t('invites.generateFailed'), variant: 'destructive' });
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateCode) return;
    try {
      await deactivateMutation.mutateAsync(deactivateCode);
      setDeactivateCode(null);
      toast({ title: t('common.success') });
    } catch {
      toast({ title: t('invites.deactivateFailed'), variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isExpired = (dateString: string) => new Date(dateString) < new Date();

  const isLoading = codesLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('invites.title')}</h1>
        <p className="text-muted-foreground">{t('invites.subtitle')}</p>
      </div>

      {/* Two-column layout: coaches left, members right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ==================== COACH CODES SECTION ==================== */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('invites.coachInvite')}</h2>
              <p className="text-sm text-muted-foreground">{t('invites.coachInviteDescription')}</p>
            </div>
          </div>

          {/* Show existing coach code or generate button */}
          {existingCoachCode ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t('invites.inviteCode')}</span>
                <span className="text-xl font-bold font-mono tracking-widest text-primary">
                  {existingCoachCode.code}
                </span>
              </div>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopy(existingCoachCode.code)}
                >
                  {copiedCode === existingCoachCode.code ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {t('invites.copy')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleShare(existingCoachCode.code)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('invites.share')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {existingCoachCode.usedCount}/{existingCoachCode.maxUses} {t('invites.used')} &bull; {t('invites.expires')} {formatDate(existingCoachCode.expiresAt)}
              </p>
            </div>
          ) : (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerateCoach}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.generating')}
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  {t('invites.generateCode')}
                </>
              )}
            </Button>
          )}

          {/* Active coach codes list */}
          {coachValid.length > 1 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('invites.activeCodes')}</h3>
              {coachValid.slice(1).map((invite) => (
                <InviteCodeCard
                  key={invite._id}
                  invite={invite}
                  copiedCode={copiedCode}
                  onCopy={(code) => handleCopy(code)}
                  onShare={(code) => handleShare(code)}
                  onDeactivate={setDeactivateCode}
                />
              ))}
            </div>
          )}

          {/* Expired coach codes */}
          {coachInvalid.length > 0 && (
            <div>
              <button
                onClick={() => setShowExpiredCoach(!showExpiredCoach)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {showExpiredCoach ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {t('invites.expiredCodes')} ({coachInvalid.length})
              </button>
              {showExpiredCoach && (
                <div className="space-y-2 mt-2">
                  {coachInvalid.map((invite) => (
                    <ExpiredCodeRow key={invite._id} invite={invite} isExpired={isExpired} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== MEMBER CODES SECTION ==================== */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('invites.memberInvite')}</h2>
              <p className="text-sm text-muted-foreground">{t('invites.generateDescription')}</p>
            </div>
          </div>

          {/* Group Selector */}
          <div className="space-y-2 max-w-md">
            <Label>{t('invites.selectGroup')}</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder={t('invites.selectGroup') + '...'} />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.color || '#22c55e' }}
                      />
                      {group.name}
                      {group.ageGroup && ` (${group.ageGroup})`}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Existing code or generate button */}
          {selectedGroup && existingCodeForGroup ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{t('invites.inviteCode')}</span>
                <span className="text-xl font-bold font-mono tracking-widest text-primary">
                  {existingCodeForGroup.code}
                </span>
              </div>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopy(existingCodeForGroup.code, selectedGroup.name)}
                >
                  {copiedCode === existingCodeForGroup.code ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {t('invites.copy')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleShare(existingCodeForGroup.code, selectedGroup.name)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('invites.share')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {existingCodeForGroup.usedCount}/{existingCodeForGroup.maxUses} {t('invites.used')} &bull; {t('invites.expires')} {formatDate(existingCodeForGroup.expiresAt)}
              </p>
            </div>
          ) : selectedGroup ? (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerateMember}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.generating')}
                </>
              ) : (
                <>
                  <Ticket className="mr-2 h-4 w-4" />
                  {t('invites.generateCode')}
                </>
              )}
            </Button>
          ) : null}

          {/* Active member codes list */}
          {memberValid.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('invites.activeCodes')}</h3>
              {memberValid.map((invite) => {
                const groupName = invite.groupId
                  ? typeof invite.groupId === 'string' ? invite.groupId : invite.groupId.name
                  : 'N/A';
                const groupColor = invite.groupId && typeof invite.groupId !== 'string'
                  ? invite.groupId.color || '#22c55e'
                  : '#22c55e';

                return (
                  <InviteCodeCard
                    key={invite._id}
                    invite={invite}
                    groupName={groupName}
                    groupColor={groupColor}
                    copiedCode={copiedCode}
                    onCopy={(code) => handleCopy(code, groupName)}
                    onShare={(code) => handleShare(code, groupName)}
                    onDeactivate={setDeactivateCode}
                  />
                );
              })}
            </div>
          )}

          {/* Expired member codes */}
          {memberInvalid.length > 0 && (
            <div>
              <button
                onClick={() => setShowExpiredMember(!showExpiredMember)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {showExpiredMember ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {t('invites.expiredCodes')} ({memberInvalid.length})
              </button>
              {showExpiredMember && (
                <div className="space-y-2 mt-2">
                  {memberInvalid.map((invite) => {
                    const groupName = invite.groupId
                      ? typeof invite.groupId === 'string' ? invite.groupId : invite.groupId.name
                      : 'N/A';
                    return <ExpiredCodeRow key={invite._id} invite={invite} isExpired={isExpired} groupName={groupName} />;
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Empty state */}
      {inviteCodes && inviteCodes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium">{t('invites.noInvites')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('invites.noInvitesDescription')}</p>
          </CardContent>
        </Card>
      )}

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={!!deactivateCode}
        onOpenChange={(open) => !open && setDeactivateCode(null)}
        title={t('invites.deactivateCode')}
        message={t('invites.deactivateConfirm')}
        onConfirm={handleDeactivate}
        confirmText={t('invites.deactivate')}
        cancelText={t('common.cancel')}
        variant="destructive"
      />
    </div>
  );
}

// Reusable active invite code card
function InviteCodeCard({
  invite,
  groupName,
  groupColor,
  copiedCode,
  onCopy,
  onShare,
  onDeactivate,
}: {
  invite: InviteCode;
  groupName?: string;
  groupColor?: string;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  onShare: (code: string) => void;
  onDeactivate: (code: string) => void;
}) {
  const { t } = useTranslation();
  const color = groupColor || '#22c55e';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <CardContent className="p-4 flex items-center gap-4 flex-1">
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-lg tracking-wider">{invite.code}</div>
            {groupName && (
              <div className="text-sm font-medium" style={{ color }}>
                {groupName}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {invite.usedCount}/{invite.maxUses} {t('invites.used')} &bull; {formatDate(invite.expiresAt)}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCopy(invite.code)}
            >
              {copiedCode === invite.code ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onShare(invite.code)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={() => onDeactivate(invite.code)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// Expired code row
function ExpiredCodeRow({
  invite,
  isExpired,
  groupName,
}: {
  invite: InviteCode;
  isExpired: (date: string) => boolean;
  groupName?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/30 opacity-70">
      <div className="flex-1 min-w-0">
        <div className="font-mono font-semibold text-sm text-muted-foreground tracking-wider">
          {invite.code}
        </div>
        {groupName && <div className="text-xs text-muted-foreground">{groupName}</div>}
      </div>
      <Badge variant="destructive" className="text-xs">
        {isExpired(invite.expiresAt) ? t('status.expired') : t('status.inactive')}
      </Badge>
    </div>
  );
}
