import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Users,
  Bell,
  Loader2,
  CreditCard,
  Stethoscope,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  useMembershipEvidence,
  useMedicalEvidence,
  useSendPaymentReminder,
  useSendPaymentReminderAll,
  useSendMedicalReminder,
  useSendMedicalReminderAll,
  useBulkUpdateMedical,
  EvidenceMember,
  MedicalEvidenceMember,
  MedicalGroupWithMembers,
} from './useEvidence';
import { useToast } from '@/hooks/use-toast';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { RecordMedicalDialog } from './RecordMedicalDialog';
import { Skeleton } from '@/components/ui/skeleton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

export function EvidencePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'membership' | 'medical'>('membership');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; membershipFee?: number } | null>(null);
  const [bulkMedicalDialogOpen, setBulkMedicalDialogOpen] = useState(false);
  const [selectedGroupForBulkMedical, setSelectedGroupForBulkMedical] = useState<MedicalGroupWithMembers | null>(null);

  const { data: membershipData, isLoading: membershipLoading } = useMembershipEvidence({
    month: selectedMonth,
    year: selectedYear,
  });
  const { data: medicalData, isLoading: medicalLoading } = useMedicalEvidence({});

  const sendReminderMutation = useSendPaymentReminder();
  const sendReminderAllMutation = useSendPaymentReminderAll();
  const sendMedicalReminderMutation = useSendMedicalReminder();
  const sendMedicalReminderAllMutation = useSendMedicalReminderAll();

  // Group membership evidence by group
  const membershipGroups = useMemo(() => {
    if (!membershipData?.evidence) return [];

    const groupMap = new Map<string, { name: string; color?: string; members: EvidenceMember[] }>();
    membershipData.evidence.forEach((m) => {
      // Apply filter
      if (filterStatus === 'paid' && m.status !== 'PAID') return;
      if (filterStatus === 'unpaid' && m.status === 'PAID') return;

      const gId = m.group?._id || 'unknown';
      if (!groupMap.has(gId)) {
        groupMap.set(gId, { name: m.group?.name || 'Bez grupe', color: m.group?.color, members: [] });
      }
      if (searchQuery) {
        if (m.memberName.toLowerCase().includes(searchQuery.toLowerCase())) {
          groupMap.get(gId)!.members.push(m);
        }
      } else {
        groupMap.get(gId)!.members.push(m);
      }
    });

    return Array.from(groupMap.entries())
      .map(([id, data]) => ({
        _id: id,
        name: data.name,
        color: data.color,
        members: data.members,
        paidCount: data.members.filter((m) => m.status === 'PAID').length,
        totalCount: data.members.length,
      }))
      .filter((g) => g.totalCount > 0);
  }, [membershipData, searchQuery, filterStatus]);

  // Group medical evidence by group
  const medicalGroups = useMemo(() => {
    if (!medicalData?.evidence) return [];

    const groupMap = new Map<string, { name: string; color?: string; members: MedicalEvidenceMember[] }>();
    medicalData.evidence.forEach((m) => {
      // Apply filter
      if (filterStatus === 'paid' && m.medicalStatus !== 'VALID') return;
      if (filterStatus === 'unpaid' && m.medicalStatus === 'VALID') return;

      const gId = m.group?._id || 'unknown';
      if (!groupMap.has(gId)) {
        groupMap.set(gId, { name: m.group?.name || 'Bez grupe', color: m.group?.color, members: [] });
      }
      if (searchQuery) {
        if (m.memberName.toLowerCase().includes(searchQuery.toLowerCase())) {
          groupMap.get(gId)!.members.push(m);
        }
      } else {
        groupMap.get(gId)!.members.push(m);
      }
    });

    return Array.from(groupMap.entries())
      .map(([id, data]) => ({
        _id: id,
        name: data.name,
        color: data.color,
        members: data.members,
        validCount: data.members.filter((m) => m.medicalStatus === 'VALID').length,
        totalCount: data.members.length,
      }))
      .filter((g) => g.totalCount > 0);
  }, [medicalData, searchQuery, filterStatus]);

  const handleOpenPaymentDialog = (memberId: string, memberName: string, membershipFee?: number) => {
    setSelectedMember({ id: memberId, name: memberName, membershipFee });
    setPaymentDialogOpen(true);
  };

  const handleOpenMedicalDialog = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
    setMedicalDialogOpen(true);
  };

  const handleSendReminder = async (memberId: string) => {
    try {
      await sendReminderMutation.mutateAsync(memberId);
      toast({ title: 'Uspešno', description: 'Podsetnik poslat' });
    } catch {
      toast({ title: 'Greška', description: 'Podsetnik nije poslat', variant: 'destructive' });
    }
  };

  const handleSendMedicalReminder = async (memberId: string) => {
    try {
      await sendMedicalReminderMutation.mutateAsync(memberId);
      toast({ title: 'Uspešno', description: 'Podsetnik poslat' });
    } catch {
      toast({ title: 'Greška', description: 'Podsetnik nije poslat', variant: 'destructive' });
    }
  };

  const handleRemindAll = async () => {
    try {
      if (activeTab === 'membership') {
        await sendReminderAllMutation.mutateAsync();
      } else {
        await sendMedicalReminderAllMutation.mutateAsync();
      }
      toast({ title: 'Uspešno', description: 'Podsetnici su poslati svim članovima' });
    } catch {
      toast({ title: 'Greška', description: 'Podsetnici nisu poslati', variant: 'destructive' });
    }
  };

  const stats = membershipData?.stats;
  const medStats = medicalData?.stats;
  const isLoading = activeTab === 'membership' ? membershipLoading : medicalLoading;

  const unpaidCount = stats ? stats.pending + stats.overdue + stats.notCreated + (stats.partial || 0) : 0;

  // Calculate total collected from evidence data
  const totalCollected = useMemo(() => {
    if (!membershipData?.evidence) return 0;
    return membershipData.evidence.reduce((sum, member) => {
      if (member.payment?.paidAmount) {
        return sum + member.payment.paidAmount;
      } else if (member.status === 'PAID' && member.payment?.amount) {
        return sum + member.payment.amount;
      }
      return sum;
    }, 0);
  }, [membershipData]);

  // Calculate total amount that should be collected
  const totalAmount = useMemo(() => {
    if (!membershipData?.evidence) return 0;
    return membershipData.evidence.reduce((sum, member) => {
      if (member.payment?.amount) {
        return sum + member.payment.amount;
      }
      return sum;
    }, 0);
  }, [membershipData]);

  const remainingAmount = totalAmount - totalCollected;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats Bar */}
      {activeTab === 'membership' ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Ukupno plaćeno</p>
            <p className="text-2xl font-bold text-foreground">{stats?.paid || 0}/{stats?.total || 0}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('evidence.totalCollected')}</p>
            <p className="text-2xl font-bold text-green-600">{totalCollected} RSD</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('evidence.remainingToCollect')}</p>
            <p className="text-2xl font-bold text-red-600">{remainingAmount} RSD</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Validni pregledi</p>
            <p className="text-2xl font-bold text-green-500">{medStats?.valid || 0}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Ističe uskoro</p>
            <p className="text-2xl font-bold text-yellow-500">{medStats?.expiringSoon || 0}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Istekli / Nisu uneti</p>
            <p className="text-2xl font-bold text-red-500">{(medStats?.expired || 0) + (medStats?.notSet || 0)}</p>
          </div>
        </div>
      )}

      {/* Search Bar + Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('evidence.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Month/Year Picker - only for membership */}
        {activeTab === 'membership' && (
          <>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              Svi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('paid')}>
              {activeTab === 'membership' ? 'Plaćeno' : 'Validni'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('unpaid')}>
              {activeTab === 'membership' ? 'Neplaćeno' : 'Nevalidni'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1 h-12">
          <TabsTrigger
            value="membership"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white h-10 text-base gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {t('evidence.memberships')}
          </TabsTrigger>
          <TabsTrigger
            value="medical"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white h-10 text-base gap-2"
          >
            <Stethoscope className="h-4 w-4" />
            {t('evidence.medicalExaminations')}
          </TabsTrigger>
        </TabsList>

        {/* Membership Tab */}
        <TabsContent value="membership" className="mt-4 space-y-4">
          {membershipGroups.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nema članova za prikaz</p>
            </div>
          ) : (
            membershipGroups.map((group) => (
              <div key={group._id} className="space-y-3 bg-muted/50 rounded-lg p-3">
                {/* Group Header */}
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 p-2 rounded-md transition-colors"
                  onClick={() => toggleGroup(group._id)}
                >
                  {expandedGroups.has(group._id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color || '#ef4444' }}
                  />
                  <h3 className="font-semibold text-base">{group.name}</h3>
                  <span className="text-sm text-muted-foreground">{group.totalCount} {t('evidence.membersLabel')}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {group.paidCount}/{group.totalCount} plaćeno
                  </span>
                </div>

                {/* Members List */}
                {expandedGroups.has(group._id) && (
                  <div className="space-y-2 pl-6">
                    {group.members.map((member) => (
                      <MembershipRow
                        key={member.memberId}
                        member={member}
                        onMarkPaid={() => handleOpenPaymentDialog(member.memberId, member.memberName, member.payment?.amount)}
                        onSendReminder={() => handleSendReminder(member.memberId)}
                        isReminderLoading={sendReminderMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="mt-4 space-y-4">
          {medicalGroups.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nema članova za prikaz</p>
            </div>
          ) : (
            medicalGroups.map((group) => (
              <div key={group._id} className="space-y-3 bg-muted/50 rounded-lg p-3">
                {/* Group Header */}
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 p-2 rounded-md transition-colors"
                  onClick={() => toggleGroup(group._id)}
                >
                  {expandedGroups.has(group._id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color || '#ef4444' }}
                  />
                  <h3 className="font-semibold text-base">{group.name}</h3>
                  <span className="text-sm text-muted-foreground">{group.totalCount} {t('evidence.membersLabel')}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {group.validCount} validnih
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-green-600/10 hover:bg-green-600/20 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupForBulkMedical(group);
                      setBulkMedicalDialogOpen(true);
                    }}
                    title="Evidentiraj pregled za celu grupu"
                  >
                    <Stethoscope className="h-4 w-4 text-green-500" />
                  </Button>
                </div>

                {/* Members List */}
                {expandedGroups.has(group._id) && (
                  <div className="space-y-2 pl-6">
                    {group.members.map((member) => (
                      <MedicalRow
                        key={member.memberId}
                        member={member}
                        onUpdateMedical={() => handleOpenMedicalDialog(member.memberId, member.memberName)}
                        onSendReminder={() => handleSendMedicalReminder(member.memberId)}
                        isReminderLoading={sendMedicalReminderMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Remind All Button */}
      {((activeTab === 'membership' && unpaidCount > 0) ||
        (activeTab === 'medical' && ((medStats?.expired || 0) + (medStats?.notSet || 0)) > 0)) && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 h-11 text-base font-semibold rounded-xl"
          onClick={handleRemindAll}
          disabled={sendReminderAllMutation.isPending || sendMedicalReminderAllMutation.isPending}
        >
          {(sendReminderAllMutation.isPending || sendMedicalReminderAllMutation.isPending) ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Bell className="mr-2 h-5 w-5" />
          )}
          {t('evidence.remindAll')}
        </Button>
      )}

      {/* Dialogs */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        memberId={selectedMember?.id || ''}
        memberName={selectedMember?.name || ''}
        month={selectedMonth}
        year={selectedYear}
        membershipFee={selectedMember?.membershipFee}
      />
      <RecordMedicalDialog
        open={medicalDialogOpen}
        onOpenChange={setMedicalDialogOpen}
        memberId={selectedMember?.id || ''}
        memberName={selectedMember?.name || ''}
      />
      <BulkMedicalDialog
        open={bulkMedicalDialogOpen}
        onOpenChange={setBulkMedicalDialogOpen}
        group={selectedGroupForBulkMedical}
      />
    </div>
  );
}

// Membership Row Component
function MembershipRow({
  member,
  onMarkPaid,
  onSendReminder,
  isReminderLoading,
}: {
  member: EvidenceMember;
  onMarkPaid: () => void;
  onSendReminder: () => void;
  isReminderLoading: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isPaid = member.status === 'PAID';
  const isPartial = member.status === 'PARTIAL';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/70 hover:bg-muted transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/member/${member.memberId}`)}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold flex-shrink-0">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.memberName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm">{getInitials(member.memberName)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{member.memberName}</p>
        <div className="flex items-center gap-1 text-xs">
          {isPaid ? (
            <span className="text-green-500">Plaćeno ✓</span>
          ) : isPartial ? (
            <span className="text-orange-500">Delimično plaćeno ・</span>
          ) : (
            <span className="text-red-500">Nije plaćeno ・</span>
          )}
          <span className="text-muted-foreground">{t('evidence.lastTraining', { date: t('evidence.lastTrainingYesterday') })}</span>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex gap-2 flex-shrink-0">
        {/* Payment Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onMarkPaid();
          }}
          title="Evidentiraj uplatu"
        >
          <CreditCard className="h-5 w-5 text-white" />
        </Button>

        {/* Bell Icon - only for unpaid */}
        {!isPaid && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-yellow-600 hover:bg-yellow-700 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onSendReminder();
            }}
            disabled={isReminderLoading}
            title="Pošalji podsetnik"
          >
            <Bell className="h-5 w-5 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Medical Row Component
function MedicalRow({
  member,
  onUpdateMedical,
  onSendReminder,
  isReminderLoading,
}: {
  member: MedicalEvidenceMember;
  onUpdateMedical: () => void;
  onSendReminder: () => void;
  isReminderLoading: boolean;
}) {
  const navigate = useNavigate();
  const statusConfig = {
    VALID: { color: 'text-green-500', label: 'Validan ✓' },
    EXPIRING_SOON: { color: 'text-yellow-500', label: 'Ističe uskoro ・' },
    EXPIRED: { color: 'text-red-500', label: 'Istekao ・' },
    NOT_SET: { color: 'text-red-500', label: 'Nije unet ・' },
  };

  const config = statusConfig[member.medicalStatus] || statusConfig.NOT_SET;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/70 hover:bg-muted transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/member/${member.memberId}`)}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold flex-shrink-0">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.memberName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm">{getInitials(member.memberName)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{member.memberName}</p>
        <div className="flex items-center gap-1 text-xs">
          <span className={config.color}>{config.label}</span>
          {member.expiryDate && (
            <span className="text-muted-foreground">do {formatDate(member.expiryDate)}</span>
          )}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex gap-2 flex-shrink-0">
        {/* Medical Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateMedical();
          }}
          title="Ažuriraj pregled"
        >
          <Stethoscope className="h-5 w-5 text-white" />
        </Button>

        {/* Bell Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-yellow-600 hover:bg-yellow-700 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSendReminder();
          }}
          disabled={isReminderLoading}
          title="Pošalji podsetnik"
        >
          <Bell className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Bulk Medical Dialog Component
function BulkMedicalDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: MedicalGroupWithMembers | null;
}) {
  const { toast } = useToast();
  const bulkUpdateMedical = useBulkUpdateMedical();
  const today = toLocalDateStr(new Date());

  const [checkDate, setCheckDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return toLocalDateStr(d);
  });

  const handleCheckDateChange = (value: string) => {
    setCheckDate(value);
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      const expiry = new Date(y, m - 1 + 6, d);
      setExpiryDate(toLocalDateStr(expiry));
    }
  };

  const resetForm = () => {
    setCheckDate(today);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setExpiryDate(toLocalDateStr(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !checkDate || !expiryDate) return;

    const memberIds = group.members.map((m) => m.memberId);

    try {
      await bulkUpdateMedical.mutateAsync({
        memberIds,
        lastCheckDate: new Date(checkDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
      });

      toast({
        title: 'Uspešno',
        description: `Lekarski pregled evidentiran za ${memberIds.length} članova grupe ${group.name}`,
      });
      onOpenChange(false);
    } catch {
      toast({ title: 'Greška', description: 'Pregled nije ažuriran', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-500" />
            Pregled za celu grupu
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {group && (
              <div className="text-sm text-muted-foreground">
                Grupa: <span className="font-medium text-foreground">{group.name}</span>
                <span className="ml-2">({group.members.length} članova)</span>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="bulkCheckDate">Datum pregleda</Label>
              <Input
                id="bulkCheckDate"
                type="date"
                value={checkDate}
                onChange={(e) => handleCheckDateChange(e.target.value)}
                max={today}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulkExpiryDate">Važi do</Label>
              <Input
                id="bulkExpiryDate"
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={bulkUpdateMedical.isPending}>
              Otkaži
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={bulkUpdateMedical.isPending}>
              {bulkUpdateMedical.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Čuvanje...</>
              ) : (
                `Sačuvaj za ${group?.members.length ?? 0} članova`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
