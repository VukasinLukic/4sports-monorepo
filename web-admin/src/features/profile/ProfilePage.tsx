import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useMemberByUserId,
  useMemberDetail,
  useMemberPayments,
  useMemberAttendance,
  useUserProfile,
  useSendPaymentReminder,
  useSendMedicalReminder,
} from './useProfile';
import type { MemberPayment, AttendanceRecord, MemberDetail } from './useProfile';
import { useCreateConversation } from '@/features/chat/useChat';
import { EditMemberDialog } from '@/features/members/EditMemberDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  CreditCard,
  CalendarCheck,
  Cake,
  Ruler,
  Weight,
  MapPin,
  Hash,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  UserCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  Bell,
  Stethoscope,
  Users,
  Wallet,
  HeartPulse,
  PencilIcon,
} from 'lucide-react';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

type Tab = 'profile' | 'payments' | 'attendance';

export function ProfilePage() {
  const { userId, memberId: memberIdParam } = useParams<{ userId?: string; memberId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const stateGroupName = (location.state as { groupName?: string } | null)?.groupName;
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mode A: /profile/:userId → resolve member by userId first
  const { data: basicMember, isLoading: loadingBasic, isError: memberByUserError } = useMemberByUserId(
    !memberIdParam ? userId : undefined
  );

  // Mode B: /profile/member/:memberId → skip userId lookup
  const resolvedMemberId = memberIdParam || basicMember?._id;

  // Full member details
  const { data: member, isLoading: loadingDetail } = useMemberDetail(resolvedMemberId);

  // Fallback: if userId provided but not a member → try user profile (coach/owner)
  const shouldFetchUser = !!userId && !memberIdParam && memberByUserError;
  const { data: userProfile, isLoading: loadingUser } = useUserProfile(userId, shouldFetchUser);

  // Payments & Attendance
  const { data: payments } = useMemberPayments(resolvedMemberId);
  const { data: attendanceData } = useMemberAttendance(resolvedMemberId);

  // Calculate payment status based on CURRENT MONTH only
  const calculatedPaymentStatus = useMemo(() => {
    if (!member || !payments) return 'UNPAID';

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Find current month's payment
    const currentMonthPayment = payments.find((p: any) =>
      p.type === 'MEMBERSHIP' &&
      p.period?.month === currentMonth &&
      p.period?.year === currentYear
    );

    // If no payment record for current month, assume unpaid
    if (!currentMonthPayment) return 'UNPAID';

    const paidAmount = currentMonthPayment.paidAmount ?? 0;
    const totalAmount = currentMonthPayment.amount ?? 0;

    console.log(`[PaymentStatus] Member: ${member.fullName}`, {
      currentMonth,
      currentYear,
      paidAmount,
      totalAmount,
      status: paidAmount === 0 ? 'UNPAID' : paidAmount >= totalAmount ? 'PAID' : 'PARTIAL'
    });

    if (paidAmount === 0) {
      return 'UNPAID';
    } else if (paidAmount >= totalAmount) {
      return 'PAID';
    } else {
      return 'PARTIAL';
    }
  }, [member, payments]);

  // Actions
  const paymentReminder = useSendPaymentReminder();
  const medicalReminder = useSendMedicalReminder();
  const createConversation = useCreateConversation();

  const isLoading = loadingBasic || loadingDetail || loadingUser;

  const handleSendPaymentReminder = async () => {
    if (!member?._id) return;
    try {
      await paymentReminder.mutateAsync(member._id);
      toast({ title: t('profile.reminderSent'), variant: 'success' });
    } catch {
      toast({ title: t('profile.reminderFailed'), variant: 'destructive' });
    }
  };

  const handleSendMedicalReminder = async () => {
    if (!member?._id) return;
    try {
      await medicalReminder.mutateAsync(member._id);
      toast({ title: t('profile.reminderSent'), variant: 'success' });
    } catch {
      toast({ title: t('profile.reminderFailed'), variant: 'destructive' });
    }
  };

  const handleStartChat = async () => {
    const chatUserId = userId || (member as MemberDetail & { userId?: string })?.userId;
    if (!chatUserId) return;
    try {
      const result = await createConversation.mutateAsync({
        participantIds: [chatUserId],
        type: '1-on-1',
      });
      const conversation = {
        ...result,
        id: result.conversationId || result.id,
      };
      navigate('/chat', { state: { conversation } });
    } catch {
      toast({ title: t('profile.chatFailed'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Coach/Owner profile (not a member) ────────────
  if (!member && userProfile) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('profile.back')}
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 flex-shrink-0">
                <AvatarImage src={userProfile.profilePicture || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(userProfile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold">{userProfile.fullName}</h1>
                <span className="inline-block mt-1 text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {userProfile.role === 'COACH' ? t('roles.coach') : t('roles.owner')}
                </span>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={handleStartChat} disabled={createConversation.isPending}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('profile.startChat')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="font-semibold text-xl">{t('profile.details')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userProfile.email && (
                <DetailRow
                  icon={<Mail className="h-5 w-5" />}
                  label={t('profile.email')}
                  value={<a href={`mailto:${userProfile.email}`} className="text-primary hover:underline">{userProfile.email}</a>}
                />
              )}
              {userProfile.phoneNumber && (
                <DetailRow
                  icon={<Phone className="h-5 w-5" />}
                  label={t('profile.phone')}
                  value={<a href={`tel:${userProfile.phoneNumber}`} className="text-primary hover:underline">{userProfile.phoneNumber}</a>}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('profile.back')}
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          {t('profile.notFound')}
        </div>
      </div>
    );
  }

  const groupObj =
    (member.groupId && typeof member.groupId === 'object' ? member.groupId : null)
    || (basicMember?.groupId && typeof basicMember.groupId === 'object' ? basicMember.groupId : null);
  const groupName = groupObj?.name || stateGroupName;
  const chatUserId = userId || (member as MemberDetail & { userId?: string })?.userId;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('profile.back')}
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={member.profileImage || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold">{member.fullName}</h1>
              {groupName && (
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-base text-primary font-medium">{groupName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <PaymentStatusBadge status={calculatedPaymentStatus} t={t} />
                <MedicalStatusBadge status={member.medicalCheckStatus} t={t} />
              </div>
            </div>
            {/* Action buttons - right side */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
              {chatUserId && (
                <Button size="sm" onClick={handleStartChat} disabled={createConversation.isPending}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t('profile.startChat')}
                </Button>
              )}
              {calculatedPaymentStatus !== 'PAID' && (
                <Button size="sm" variant="outline" onClick={handleSendPaymentReminder} disabled={paymentReminder.isPending}>
                  <Bell className="mr-2 h-4 w-4" />
                  {t('profile.paymentReminder')}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleSendMedicalReminder} disabled={medicalReminder.isPending}>
                <Stethoscope className="mr-2 h-4 w-4" />
                {t('profile.medicalReminder')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-lg">
        <TabButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={<User className="h-5 w-5" />}
          label={t('profile.tabProfile')}
        />
        <TabButton
          active={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          icon={<CreditCard className="h-5 w-5" />}
          label={t('profile.tabPayments')}
        />
        <TabButton
          active={activeTab === 'attendance'}
          onClick={() => setActiveTab('attendance')}
          icon={<CalendarCheck className="h-5 w-5" />}
          label={t('profile.tabAttendance')}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab member={member} t={t} />}
      {activeTab === 'payments' && <PaymentsTab member={member} payments={payments || []} t={t} />}
      {activeTab === 'attendance' && <AttendanceTab data={attendanceData} t={t} />}

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={member ? { ...member, id: member._id } : null}
      />
    </div>
  );
}

// ─── Tab Button ────────────────────────────────────
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-base font-medium transition-colors ${
        active
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Status Badges ─────────────────────────────────
function PaymentStatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const config: Record<string, { className: string; label: string }> = {
    PAID: { className: 'bg-green-600 text-white', label: t('status.paid') },
    PARTIAL: { className: 'bg-orange-500 text-white', label: t('profile.partial') },
    UNPAID: { className: 'bg-red-600 text-white', label: t('status.unpaid') },
  };
  const c = config[status] || config.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${c.className}`}>
      <Wallet className="h-4 w-4" />
      {c.label}
    </span>
  );
}

function MedicalStatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const config: Record<string, { className: string; label: string }> = {
    VALID: { className: 'bg-green-600 text-white', label: t('status.valid') },
    EXPIRING_SOON: { className: 'bg-orange-500 text-white', label: t('status.expiringSoon') },
    EXPIRED: { className: 'bg-red-600 text-white', label: t('status.expired') },
  };
  const c = config[status] || config.EXPIRED;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${c.className}`}>
      <HeartPulse className="h-4 w-4" />
      {c.label}
    </span>
  );
}

// ─── Profile Tab ───────────────────────────────────
function ProfileTab({
  member,
  t,
}: {
  member: MemberDetail;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('sr-RS');
  };

  const parentInfo = member.parentId && typeof member.parentId === 'object' ? member.parentId : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-5">
          <h3 className="font-semibold text-xl">{t('profile.details')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={<Cake className="h-5 w-5" />} label={t('profile.dateOfBirth')} value={formatDate(member.dateOfBirth)} />
            <DetailRow icon={<User className="h-5 w-5" />} label={t('profile.age')} value={member.age ? `${member.age} ${t('profile.years')}` : '-'} />
            <DetailRow icon={<MapPin className="h-5 w-5" />} label={t('profile.position')} value={member.position || '-'} />
            <DetailRow icon={<Hash className="h-5 w-5" />} label={t('profile.jerseyNumber')} value={member.jerseyNumber?.toString() || '-'} />
            <DetailRow icon={<Ruler className="h-5 w-5" />} label={t('profile.height')} value={member.height ? `${member.height} cm` : '-'} />
            <DetailRow icon={<Weight className="h-5 w-5" />} label={t('profile.weight')} value={member.weight ? `${member.weight} kg` : '-'} />
            <DetailRow icon={<ShieldCheck className="h-5 w-5" />} label={t('profile.medicalExpiry')} value={formatDate(member.medicalCheckExpiryDate)} />
            <DetailRow icon={<Calendar className="h-5 w-5" />} label={t('profile.joinDate')} value={formatDate(member.createdAt)} />
          </div>
        </CardContent>
      </Card>

      {parentInfo && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="font-semibold text-xl">{t('profile.parentInfo')}</h3>
            <div className="space-y-4">
              <DetailRow icon={<UserCircle className="h-5 w-5" />} label={t('profile.parentName')} value={parentInfo.fullName} />
              {parentInfo.phoneNumber && (
                <DetailRow
                  icon={<Phone className="h-5 w-5" />}
                  label={t('profile.parentPhone')}
                  value={
                    <a href={`tel:${parentInfo.phoneNumber}`} className="text-primary hover:underline">
                      {parentInfo.phoneNumber}
                    </a>
                  }
                />
              )}
              {parentInfo.email && (
                <DetailRow
                  icon={<Mail className="h-5 w-5" />}
                  label={t('profile.parentEmail')}
                  value={
                    <a href={`mailto:${parentInfo.email}`} className="text-primary hover:underline">
                      {parentInfo.email}
                    </a>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Payments Tab ──────────────────────────────────
function PaymentsTab({
  member,
  payments,
  t,
}: {
  member: MemberDetail;
  payments: MemberPayment[];
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const monthNames = t('calendar.shortMonths', { returnObjects: true }) as unknown as string[];

  const stats = useMemo(() => {
    const fee = member.membershipFee || 3000;
    const now = new Date();
    // Use club joinedAt date if available, otherwise use member createdAt
    let joinDate = new Date(member.createdAt);
    if (member.clubs && member.clubs.length > 0) {
      const activeClub = member.clubs.find((c: any) => c.status === 'ACTIVE') || member.clubs[0];
      if (activeClub?.joinedAt) {
        joinDate = new Date(activeClub.joinedAt);
      }
    }
    const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()) + 1;
    const totalMonths = Math.max(1, monthsDiff);

    const membershipPayments = payments.filter((p) => p.type === 'MEMBERSHIP');
    const paidStatusPayments = membershipPayments.filter((p) => p.status === 'PAID' || p.status === 'PARTIAL');
    const totalPaid = paidStatusPayments.reduce((sum, p) => sum + (p.paidAmount ?? p.amount ?? 0), 0);
    // Calculate totalExpected from actual payment amounts (with fallback to monthly fee if amount missing)
    const totalExpected = membershipPayments.reduce((sum, p) => sum + (p.amount ?? fee), 0);
    const debt = Math.max(0, totalExpected - totalPaid);

    // Payment months = number of months with payment records
    const paymentMonths = membershipPayments.length;

    console.log(`[PaymentsTab] Member: ${member.fullName}`, {
      totalMonths,
      paymentMonths,
      fee,
      totalExpected,
      allPayments: payments.length,
      membershipPayments: membershipPayments.length,
      paidStatusPayments: paidStatusPayments.length,
      totalPaid,
      debt
    });

    return { fee: member.membershipFee || 3000, totalMonths, paymentMonths, totalPaid, debt };
  }, [member, payments]);

  const recentPayments = useMemo(() => {
    return payments
      .filter((p) => p.type === 'MEMBERSHIP' && p.period)
      .sort((a, b) => {
        if (!a.period || !b.period) return 0;
        return (b.period.year * 12 + b.period.month) - (a.period.year * 12 + a.period.month);
      });
  }, [payments]);

  const formatAmount = (amount: number) => new Intl.NumberFormat('sr-RS').format(amount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('profile.monthlyFee')}</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(stats.fee)} <span className="text-sm font-normal">RSD</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('profile.totalMonths')}</p>
            <p className="text-2xl font-bold mt-1">{stats.paymentMonths}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('profile.debt')}</p>
            <p className={`text-2xl font-bold mt-1 ${stats.debt > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatAmount(stats.debt)} <span className="text-sm font-normal">RSD</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-xl">{t('profile.paymentHistory')}</h3>
          {recentPayments.length > 0 ? (
            <div className="space-y-2">
              {recentPayments.map((payment) => (
                <PaymentRow key={payment._id} payment={payment} monthNames={monthNames} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground text-center py-4">{t('profile.noPayments')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentRow({
  payment,
  monthNames,
  t,
}: {
  payment: MemberPayment;
  monthNames: string[];
  t: (key: string) => string;
}) {
  const monthLabel = payment.period
    ? `${monthNames[payment.period.month - 1]} ${payment.period.year}`
    : '-';

  // Use actual payment amount as the expected amount
  const expectedAmount = payment.amount ?? 0;
  const paidAmount = payment.paidAmount ?? 0;

  // Determine the correct status based on paidAmount vs expectedAmount
  let status = payment.status;
  if (paidAmount === 0) {
    status = 'OVERDUE';
  } else if (paidAmount > 0 && paidAmount < expectedAmount) {
    status = 'PARTIAL';
  } else if (paidAmount >= expectedAmount) {
    status = 'PAID';
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    PAID: { color: 'bg-green-600 text-white', label: t('status.paid') },
    PARTIAL: { color: 'bg-orange-500 text-white', label: t('profile.partial') },
    PENDING: { color: 'bg-gray-500 text-white', label: t('status.pending') },
    OVERDUE: { color: 'bg-red-600 text-white', label: t('status.unpaid') },
  };
  const sc = statusConfig[status] || statusConfig.OVERDUE;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-base font-medium">{monthLabel}</p>
        <p className="text-sm text-muted-foreground">
          {new Intl.NumberFormat('sr-RS').format(paidAmount)} / {new Intl.NumberFormat('sr-RS').format(expectedAmount)} RSD
        </p>
      </div>
      <span className={`text-sm font-medium px-3 py-1 rounded-full ${sc.color}`}>
        {sc.label}
      </span>
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────
function AttendanceTab({
  data,
  t,
}: {
  data?: { attendance: AttendanceRecord[]; attendanceRate: number };
  t: (key: string) => string;
}) {
  const attendance = data?.attendance || [];
  const rate = data?.attendanceRate || 0;

  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0, excused = 0;
    for (const a of attendance) {
      if (a.status === 'PRESENT') present++;
      else if (a.status === 'LATE') late++;
      else if (a.status === 'ABSENT') absent++;
      else if (a.status === 'EXCUSED') excused++;
    }
    return { present, late, absent, excused };
  }, [attendance]);

  const recentRecords = attendance.slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-8">
            <div className="relative h-28 w-28 flex-shrink-0">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-green-500" strokeWidth="3" strokeDasharray={`${rate}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{rate}%</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <StatRow color="bg-green-500" label={t('profile.present')} count={stats.present} />
              <StatRow color="bg-orange-500" label={t('profile.late')} count={stats.late} />
              <StatRow color="bg-red-500" label={t('profile.absent')} count={stats.absent} />
              <StatRow color="bg-blue-500" label={t('profile.excused')} count={stats.excused} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-xl">{t('profile.attendanceRecord')}</h3>
          {recentRecords.length > 0 ? (
            <div className="space-y-2">
              {recentRecords.map((record) => (
                <AttendanceRow key={record._id} record={record} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground text-center py-4">{t('profile.noRecords')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-base flex-1">{label}</span>
      <span className="text-base font-semibold">{count}</span>
    </div>
  );
}

function AttendanceRow({ record, t }: { record: AttendanceRecord; t: (key: string) => string }) {
  const event = record.eventId && typeof record.eventId === 'object' ? record.eventId : null;

  const statusIcons: Record<string, React.ReactNode> = {
    PRESENT: <CheckCircle className="h-5 w-5 text-green-500" />,
    LATE: <Clock className="h-5 w-5 text-orange-500" />,
    ABSENT: <XCircle className="h-5 w-5 text-red-500" />,
    EXCUSED: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  const statusLabels: Record<string, string> = {
    PRESENT: t('profile.present'),
    LATE: t('profile.late'),
    ABSENT: t('profile.absent'),
    EXCUSED: t('profile.excused'),
  };

  const eventTypeLabels: Record<string, string> = {
    TRAINING: t('eventTypes.training'),
    MATCH: t('eventTypes.match'),
    OTHER: t('eventTypes.other'),
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={`flex items-center gap-3 py-3 border-b last:border-0 ${record.status === 'ABSENT' ? 'opacity-60' : ''}`}>
      {statusIcons[record.status] || statusIcons.ABSENT}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate">
          {event ? eventTypeLabels[event.type] || event.type : '-'}
        </p>
        <p className="text-sm text-muted-foreground">
          {event ? formatDate(event.startTime) : formatDate(record.createdAt)}
        </p>
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        {statusLabels[record.status] || record.status}
      </span>
    </div>
  );
}
