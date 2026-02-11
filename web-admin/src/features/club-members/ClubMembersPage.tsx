import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EditMemberDialog } from '../members/EditMemberDialog';
import { GroupDialog } from './GroupDialog';
import {
  useCoaches,
  useDeleteCoach,
  useMembers,
  useDeleteMember,
  useGroups,
} from './useClubMembers';
import { useInviteCodes, useGenerateInvite } from '../invites/useInvites';
import { Coach, Member, Group } from '@/types';
import {
  Search,
  User,
  GraduationCap,
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Copy,
  Check,
  Loader2,
  Ticket,
} from 'lucide-react';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useToast } from '@/hooks/use-toast';

// Helper to extract groupId string from potentially populated object
function getMemberGroupId(member: Member): string {
  const gId = member.groupId;
  if (!gId) return 'ungrouped';
  if (typeof gId === 'string') return gId;
  if (typeof gId === 'object' && '_id' in (gId as any)) return (gId as any)._id;
  return 'ungrouped';
}

export function ClubMembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search states
  const [coachSearch, setCoachSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [debouncedCoachSearch, setDebouncedCoachSearch] = useState('');
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState('');

  // Inline invite panel states
  const [showCoachInvite, setShowCoachInvite] = useState(false);
  const [showMemberInvite, setShowMemberInvite] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dialog states
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [deleteCoachDialogOpen, setDeleteCoachDialogOpen] = useState(false);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCoachSearch(coachSearch), 300);
    return () => clearTimeout(timer);
  }, [coachSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMemberSearch(memberSearch), 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // Data hooks
  const { data: coaches, isLoading: coachesLoading, isError: coachesError, refetch: refetchCoaches } = useCoaches();
  const { data: members, isLoading: membersLoading, isError: membersError, refetch: refetchMembers } = useMembers({
    search: debouncedMemberSearch,
  });
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: inviteCodes } = useInviteCodes();
  const generateMutation = useGenerateInvite();
  const deleteCoachMutation = useDeleteCoach();
  const deleteMemberMutation = useDeleteMember();

  // Filtered coaches
  const filteredCoaches = useMemo(() => {
    if (!coaches) return [];
    if (!debouncedCoachSearch) return coaches;
    return coaches.filter((c) =>
      c.fullName.toLowerCase().includes(debouncedCoachSearch.toLowerCase())
    );
  }, [coaches, debouncedCoachSearch]);

  // Group members by groupId - handles both string IDs and populated objects
  const membersByGroup = useMemo(() => {
    const map = new Map<string, Member[]>();
    members?.forEach((m) => {
      const gId = getMemberGroupId(m);
      if (!map.has(gId)) map.set(gId, []);
      map.get(gId)!.push(m);
    });
    return map;
  }, [members]);

  // Find existing valid coach code
  const existingCoachCode = useMemo(() => {
    if (!inviteCodes) return null;
    return inviteCodes.find((inv) => inv.type === 'COACH' && inv.isValid && inv.isActive) || null;
  }, [inviteCodes]);

  // Find existing valid member code for selected group
  const existingMemberCode = useMemo(() => {
    if (!selectedGroupId || !inviteCodes) return null;
    return inviteCodes.find(
      (inv) =>
        inv.type === 'MEMBER' &&
        inv.isValid &&
        inv.isActive &&
        inv.groupId &&
        (typeof inv.groupId === 'string' ? inv.groupId : inv.groupId._id) === selectedGroupId
    ) || null;
  }, [selectedGroupId, inviteCodes]);

  // Stats
  const totalCoaches = coaches?.length || 0;
  const activeCoaches = coaches?.filter(
    (c) => !isContractExpired(c.contractExpiryDate)
  ).length || 0;
  const totalMembers = members?.length || 0;
  const activeMembers = totalMembers;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

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

  const handleCopyCode = async (code: string, groupName?: string) => {
    const message = getInviteMessage(code, groupName);
    await navigator.clipboard.writeText(message);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: t('invites.codeCopied'), description: t('invites.messageCopied') });
  };

  const handleGenerateCoach = async () => {
    try {
      await generateMutation.mutateAsync({ type: 'COACH', maxUses: 1, expiresInDays: 7 });
      toast({ title: t('invites.codeGenerated') });
    } catch {
      toast({ title: t('invites.generateFailed'), variant: 'destructive' });
    }
  };

  const handleGenerateMember = async () => {
    if (!selectedGroupId) return;
    try {
      await generateMutation.mutateAsync({ type: 'MEMBER', groupId: selectedGroupId, maxUses: 30, expiresInDays: 30 });
      toast({ title: t('invites.codeGenerated') });
    } catch {
      toast({ title: t('invites.generateFailed'), variant: 'destructive' });
    }
  };

  const handleDeleteCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setDeleteCoachDialogOpen(true);
  };

  const handleDeleteCoachConfirm = async () => {
    if (selectedCoach) {
      await deleteCoachMutation.mutateAsync(selectedCoach.id);
      setSelectedCoach(null);
    }
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setEditMemberDialogOpen(true);
  };

  const handleDeleteMember = (member: Member) => {
    setSelectedMember(member);
    setDeleteMemberDialogOpen(true);
  };

  const handleDeleteMemberConfirm = async () => {
    if (selectedMember) {
      await deleteMemberMutation.mutateAsync(selectedMember.id);
      setSelectedMember(null);
    }
  };

  const handleOpenGroupDialog = (group?: Group) => {
    setEditingGroup(group || null);
    setGroupDialogOpen(true);
  };

  const isLoading = coachesLoading || membersLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <SkeletonTable rows={5} columns={2} />
          </div>
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <SkeletonTable rows={5} columns={2} />
          </div>
        </div>
      </div>
    );
  }

  if (coachesError || membersError) {
    return (
      <ErrorMessage
        message={t('errors.loadFailed')}
        onRetry={() => {
          refetchCoaches();
          refetchMembers();
        }}
      />
    );
  }

  const selectedGroup = groups?.find((g) => g._id === selectedGroupId) || null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold">{t('clubMembers.title')}</h1>

      {/* Header stat cards - two equal cards side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Coaches card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {t('clubMembers.coachesCount', { count: totalCoaches })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('clubMembers.activeCoaches', { count: activeCoaches })}
              </div>
            </div>
            <Button
              size="sm"
              className={showCoachInvite
                ? 'bg-red-600 hover:bg-red-700 flex-shrink-0'
                : 'bg-green-600 hover:bg-green-700 flex-shrink-0'}
              onClick={() => setShowCoachInvite(!showCoachInvite)}
            >
              {showCoachInvite ? t('common.close') : t('clubMembers.addCoach')}
            </Button>
          </CardContent>
        </Card>

        {/* Members card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {t('clubMembers.membersCount', { count: totalMembers })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('clubMembers.activeMembers', { count: activeMembers })}
              </div>
            </div>
            <Button
              size="sm"
              className={showMemberInvite
                ? 'bg-red-600 hover:bg-red-700 flex-shrink-0'
                : 'bg-green-600 hover:bg-green-700 flex-shrink-0'}
              onClick={() => setShowMemberInvite(!showMemberInvite)}
            >
              {showMemberInvite ? t('common.close') : t('clubMembers.addMember')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Coaches */}
        <div className="space-y-4">
          {/* Coach invite panel - separate container above coaches card */}
          {showCoachInvite && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-lg font-bold">{t('clubMembers.inviteCoachTitle')}</h3>
                {existingCoachCode ? (
                  <>
                    <div className="text-center space-y-3 py-2">
                      <div className="text-3xl font-bold font-mono tracking-widest text-primary">
                        {existingCoachCode.code}
                      </div>
                      <p className="text-base text-muted-foreground">{t('clubMembers.downloadAppAndEnterCode')}</p>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleCopyCode(existingCoachCode.code)}
                    >
                      {copiedCode === existingCoachCode.code ? (
                        <><Check className="mr-2 h-4 w-4" /> {t('invites.codeCopied')}</>
                      ) : (
                        <><Copy className="mr-2 h-4 w-4" /> {t('invites.copy')}</>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleGenerateCoach}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.generating')}</>
                    ) : (
                      <><Ticket className="mr-2 h-4 w-4" /> {t('invites.generateCode')}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-bold">{t('clubMembers.coaches')}</h2>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('clubMembers.searchCoaches')}
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Coach list */}
              <div className="space-y-2">
                {filteredCoaches.length > 0 ? (
                  filteredCoaches.map((coach) => (
                    <CoachCard
                      key={coach.id}
                      coach={coach}
                      onDelete={handleDeleteCoach}
                      onClick={() => navigate(`/profile/${coach.id}`)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('clubMembers.noCoaches')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Members */}
        <div className="space-y-4">
          {/* Member invite panel - separate container above members card */}
          {showMemberInvite && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-lg font-bold">{t('clubMembers.inviteMemberTitle')}</h3>

                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('clubMembers.chooseTeam') + '...'} />
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

                {selectedGroup && existingMemberCode ? (
                  <>
                    <div className="text-center space-y-3 py-2">
                      <div className="text-base font-semibold text-muted-foreground">{selectedGroup.name}</div>
                      <div className="text-3xl font-bold font-mono tracking-widest text-primary">
                        {existingMemberCode.code}
                      </div>
                      <p className="text-base text-muted-foreground">{t('clubMembers.downloadAppAndEnterCode')}</p>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleCopyCode(existingMemberCode.code, selectedGroup.name)}
                    >
                      {copiedCode === existingMemberCode.code ? (
                        <><Check className="mr-2 h-4 w-4" /> {t('invites.codeCopied')}</>
                      ) : (
                        <><Copy className="mr-2 h-4 w-4" /> {t('invites.copy')}</>
                      )}
                    </Button>
                  </>
                ) : selectedGroup ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleGenerateMember}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.generating')}</>
                    ) : (
                      <><Ticket className="mr-2 h-4 w-4" /> {t('invites.generateCode')}</>
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-bold">{t('clubMembers.members')}</h2>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('clubMembers.searchMembers')}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Groups with members */}
              <div className="space-y-2">
                {groups && groups.length > 0 ? (
                  groups.map((group) => {
                    const groupMembers = membersByGroup.get(group._id) || [];
                    const isExpanded = expandedGroups.has(group._id);

                    return (
                      <div key={group._id}>
                        {/* Group header - clickable to expand */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleGroup(group._id)}
                            className="flex-1 flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: group.color || '#22c55e' }}
                            />
                            <span className="font-semibold flex-1 text-left">{group.name}</span>
                            <span className="text-sm text-muted-foreground mr-2">
                              {t('clubMembers.membersInGroup', { count: groupMembers.length })}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleOpenGroupDialog(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Expanded member list */}
                        {isExpanded && (
                          <div className="ml-6 space-y-1 mb-2">
                            {groupMembers.length > 0 ? (
                              groupMembers.map((member) => (
                                <MemberCard
                                  key={member.id}
                                  member={member}
                                  onEdit={handleEditMember}
                                  onDelete={handleDeleteMember}
                                  onClick={() => navigate(`/profile/member/${member.id}`, { state: { groupName: group.name } })}
                                />
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground px-3 py-2">
                                {t('clubMembers.noMembers')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('clubMembers.noMembers')}</p>
                  </div>
                )}
              </div>

              {/* New Group button at bottom */}
              <div className="border-t pt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleOpenGroupDialog()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('clubMembers.newGroup')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
      />
      <EditMemberDialog
        open={editMemberDialogOpen}
        onOpenChange={setEditMemberDialogOpen}
        member={selectedMember}
      />
      <ConfirmDialog
        open={deleteCoachDialogOpen}
        onOpenChange={setDeleteCoachDialogOpen}
        title={t('clubMembers.deleteCoach')}
        message={t('clubMembers.deleteCoachConfirm', { name: selectedCoach?.fullName })}
        onConfirm={handleDeleteCoachConfirm}
        confirmText={t('common.remove')}
        cancelText={t('common.cancel')}
        variant="destructive"
      />
      <ConfirmDialog
        open={deleteMemberDialogOpen}
        onOpenChange={setDeleteMemberDialogOpen}
        title={t('clubMembers.deleteMember')}
        message={t('clubMembers.deleteMemberConfirm', { name: selectedMember?.fullName })}
        onConfirm={handleDeleteMemberConfirm}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
      />
    </div>
  );
}

// Helper
function isContractExpired(expiryDate: string) {
  return new Date(expiryDate) < new Date();
}

function isContractExpiringSoon(expiryDate: string) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 30 && daysUntil > 0;
}

// Coach Card
function CoachCard({ coach, onDelete, onClick }: { coach: Coach; onDelete: (c: Coach) => void; onClick?: () => void }) {
  const expired = isContractExpired(coach.contractExpiryDate);
  const expiringSoon = isContractExpiringSoon(coach.contractExpiryDate);

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{coach.fullName}</div>
        <div className="text-xs text-muted-foreground truncate">{coach.email}</div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {coach.groupsCount > 0 && (
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" title={`${coach.groupsCount} groups`} />
        )}
        {expired ? (
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" title="Contract expired" />
        ) : expiringSoon ? (
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" title="Contract expiring soon" />
        ) : (
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" title="Contract valid" />
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); onDelete(coach); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Member Card
function MemberCard({
  member,
  onEdit,
  onDelete,
  onClick,
}: {
  member: Member;
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const isActive = member.paymentStatus === 'PAID';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        {member.profileImage ? (
          <img
            src={member.profileImage}
            alt={member.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{member.fullName}</div>
      </div>
      <Badge
        variant="outline"
        className={
          isActive
            ? 'border-green-600 text-green-600 text-xs'
            : 'border-red-600 text-red-600 text-xs'
        }
      >
        {isActive ? t('status.active') : t('status.inactive')}
      </Badge>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onEdit(member); }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(member); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
