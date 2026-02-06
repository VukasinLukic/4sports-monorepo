import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Bell,
  BellRing,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  CreditCard,
  Stethoscope,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMembershipEvidence,
  useMedicalEvidence,
  useSendPaymentReminder,
  useSendPaymentReminderAll,
  useSendMedicalReminder,
  useSendMedicalReminderAll,
  EvidenceMember,
  MedicalEvidenceMember,
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
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'membership' | 'medical'>('membership');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);

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
  }, [membershipData, searchQuery]);

  // Group medical evidence by group
  const medicalGroups = useMemo(() => {
    if (!medicalData?.evidence) return [];

    const groupMap = new Map<string, { name: string; color?: string; members: MedicalEvidenceMember[] }>();
    medicalData.evidence.forEach((m) => {
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
  }, [medicalData, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Expand all groups by default on first load
  useMemo(() => {
    const allGroupIds = activeTab === 'membership'
      ? membershipGroups.map((g) => g._id)
      : medicalGroups.map((g) => g._id);
    if (allGroupIds.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(allGroupIds));
    }
  }, [membershipGroups, medicalGroups, activeTab]);

  const handleOpenPaymentDialog = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
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

  const unpaidCount = stats ? stats.pending + stats.overdue + stats.notCreated : 0;
  const collectionRate = stats && stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

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
    <div className="space-y-6">
      {/* Summary Cards */}
      {activeTab === 'membership' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Neplaćeno</p>
              <p className="text-3xl font-bold">{unpaidCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ukupno plaćeno</p>
              <p className="text-3xl font-bold">{stats?.paid || 0} / {stats?.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Stopa naplate</p>
              <p className="text-3xl font-bold">{collectionRate}%</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Validni pregledi</p>
              <p className="text-3xl font-bold text-green-600">{medStats?.valid || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ističe uskoro</p>
              <p className="text-3xl font-bold text-yellow-600">{medStats?.expiringSoon || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Istekli / Nisu uneti</p>
              <p className="text-3xl font-bold text-red-600">{(medStats?.expired || 0) + (medStats?.notSet || 0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži člana..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === 'membership' && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Članarine
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Lekarski pregledi
          </TabsTrigger>
        </TabsList>

        {/* Membership Tab */}
        <TabsContent value="membership" className="mt-4 space-y-4">
          {membershipGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nema članova za prikaz</p>
              </CardContent>
            </Card>
          ) : (
            membershipGroups.map((group) => (
              <Card key={group._id}>
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(group._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group._id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color || '#3b82f6' }}
                      />
                      <CardTitle className="text-base">{group.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {group.paidCount}/{group.totalCount}
                      </span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${group.totalCount > 0 ? (group.paidCount / group.totalCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {expandedGroups.has(group._id) && (
                  <CardContent className="pt-0 space-y-2">
                    {group.members.map((member) => (
                      <MembershipRow
                        key={member.memberId}
                        member={member}
                        onMarkPaid={() => handleOpenPaymentDialog(member.memberId, member.memberName)}
                        onSendReminder={() => handleSendReminder(member.memberId)}
                        isReminderLoading={sendReminderMutation.isPending}
                      />
                    ))}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="mt-4 space-y-4">
          {medicalGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nema članova za prikaz</p>
              </CardContent>
            </Card>
          ) : (
            medicalGroups.map((group) => (
              <Card key={group._id}>
                <CardHeader
                  className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(group._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(group._id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color || '#3b82f6' }}
                      />
                      <CardTitle className="text-base">{group.name}</CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground">{group.totalCount} članova</span>
                  </div>
                </CardHeader>
                {expandedGroups.has(group._id) && (
                  <CardContent className="pt-0 space-y-2">
                    {group.members.map((member) => (
                      <MedicalRow
                        key={member.memberId}
                        member={member}
                        onUpdateMedical={() => handleOpenMedicalDialog(member.memberId, member.memberName)}
                        onSendReminder={() => handleSendMedicalReminder(member.memberId)}
                        isReminderLoading={sendMedicalReminderMutation.isPending}
                      />
                    ))}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Remind All Button */}
      {((activeTab === 'membership' && unpaidCount > 0) ||
        (activeTab === 'medical' && ((medStats?.expired || 0) + (medStats?.notSet || 0)) > 0)) && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
          onClick={handleRemindAll}
          disabled={sendReminderAllMutation.isPending || sendMedicalReminderAllMutation.isPending}
        >
          {(sendReminderAllMutation.isPending || sendMedicalReminderAllMutation.isPending) ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <BellRing className="mr-2 h-5 w-5" />
          )}
          Podsetite sve
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
      />
      <RecordMedicalDialog
        open={medicalDialogOpen}
        onOpenChange={setMedicalDialogOpen}
        memberId={selectedMember?.id || ''}
        memberName={selectedMember?.name || ''}
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
  const isPaid = member.status === 'PAID';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors bg-muted/50',
        isPaid && 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
        member.status === 'OVERDUE' && 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.memberName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm">{getInitials(member.memberName)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.memberName}</p>
        <div className="flex items-center gap-2">
          {isPaid ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Plaćeno
            </span>
          ) : member.status === 'OVERDUE' ? (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Kasni
            </span>
          ) : member.status === 'PENDING' ? (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Na čekanju
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Nije plaćeno</span>
          )}
          {member.payment?.amount && (
            <span className="text-xs text-muted-foreground">{member.payment.amount} RSD</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {!isPaid && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={onMarkPaid}
              title="Evidentraj uplatu"
            >
              <CreditCard className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-yellow-600 hover:text-yellow-700"
              onClick={onSendReminder}
              disabled={isReminderLoading}
              title="Pošalji podsetnik"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </>
        )}
        {isPaid && (
          <Badge className="bg-green-600 hover:bg-green-700">
            <Check className="h-3 w-3 mr-1" />
            Plaćeno
          </Badge>
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
  const statusConfig = {
    VALID: { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800', label: 'Validan' },
    EXPIRING_SOON: { icon: ShieldAlert, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800', label: 'Ističe uskoro' },
    EXPIRED: { icon: ShieldX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800', label: 'Istekao' },
    NOT_SET: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Nije unet' },
  };

  const config = statusConfig[member.medicalStatus] || statusConfig.NOT_SET;
  const Icon = config.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border transition-colors', config.bg)}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
        {member.profileImage ? (
          <img src={member.profileImage} alt={member.memberName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-sm">{getInitials(member.memberName)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.memberName}</p>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs flex items-center gap-1', config.color)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          {member.expiryDate && (
            <span className="text-xs text-muted-foreground">do {formatDate(member.expiryDate)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={onUpdateMedical}
          title="Ažuriraj pregled"
        >
          <Stethoscope className="h-4 w-4" />
        </Button>
        {(member.medicalStatus === 'EXPIRED' || member.medicalStatus === 'NOT_SET') && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 text-yellow-600 hover:text-yellow-700"
            onClick={onSendReminder}
            disabled={isReminderLoading}
            title="Pošalji podsetnik"
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
