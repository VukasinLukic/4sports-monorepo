import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCoachStats } from './useCoachStats';
import type { CoachStatsData, CoachGroup, CoachUpcomingEvent, CoachMember } from './useCoachStats';
import { useCreateConversation } from '@/features/chat/useChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle,
  Hash,
} from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('sr-RS').format(amount);
}

// Generate last 12 months for picker
const getRecentMonths = (locale: string) => {
  const result = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleDateString(locale === 'sr' ? 'sr-Latn-RS' : 'en-US', { month: 'long', year: 'numeric' }),
    });
  }
  return result;
};

type CoachTab = 'overview' | 'finances' | 'events' | 'roster';

export function CoachProfilePage({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CoachTab>('overview');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const recentMonths = useMemo(() => getRecentMonths(i18n.language), [i18n.language]);
  
  const createConversation = useCreateConversation();

  const { data, isLoading } = useCoachStats(userId, selectedMonth, selectedYear);

  const handleStartChat = async () => {
    try {
      const result = await createConversation.mutateAsync({
        participantIds: [userId],
        type: '1-on-1',
      });
      const conversation = { ...result, id: result.conversationId || result.id };
      navigate('/chat', { state: { conversation } });
    } catch {
      toast({ title: t('profile.chatFailed'), variant: 'destructive' });
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { coach, kpi } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('profile.back')}
      </Button>

      {/* ─── Header Card ─── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={coach.profileImage || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(coach.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold">{coach.fullName}</h1>
              <span className="inline-block mt-1 text-sm font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                {t('roles.coach')}
              </span>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                {coach.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${coach.email}`} className="text-primary hover:underline">{coach.email}</a>
                  </div>
                )}
                {coach.phoneNumber && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${coach.phoneNumber}`} className="text-primary hover:underline">{coach.phoneNumber}</a>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{t('coachProfile.joinedOn')}: {new Date(coach.createdAt).toLocaleDateString(i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Select
                  value={`${selectedMonth}-${selectedYear}`}
                  onValueChange={(val) => {
                    const [m, y] = val.split('-');
                    setSelectedMonth(parseInt(m));
                    setSelectedYear(parseInt(y));
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Izaberite mesec" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentMonths.map((m) => (
                      <SelectItem key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`} className="capitalize">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" onClick={handleStartChat} disabled={createConversation.isPending} className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('profile.startChat')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="h-5 w-5" />}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          label={t('coachProfile.totalMembers')}
          value={kpi.totalMembers.toString()}
          sub={`${kpi.totalGroups} ${t('coachProfile.totalGroups').toLowerCase()}`}
        />
        <KPICard
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
          label={t('coachProfile.monthlyRevenue')}
          value={`${formatAmount(kpi.monthlyRevenue)} RSD`}
          sub={`${kpi.collectionRate}% ${t('coachProfile.collectionRate').toLowerCase()}`}
        />
        <KPICard
          icon={<CalendarCheck className="h-5 w-5" />}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          label={t('coachProfile.eventsThisMonth')}
          value={kpi.eventsThisMonth.toString()}
          sub={`${kpi.eventsTotal} ${t('coachProfile.totalEvents').toLowerCase()}`}
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
          label={t('coachProfile.attendanceRate')}
          value={`${kpi.attendanceRate}%`}
          sub={`${kpi.unpaidThisMonth} ${t('coachProfile.unpaidThisMonth').toLowerCase()}`}
        />
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-lg">
        {(['overview', 'finances', 'events', 'roster'] as CoachTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-md text-base font-medium transition-colors ${
              activeTab === tab
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`coachProfile.${tab === 'overview' ? 'overview' : tab === 'finances' ? 'finances' : tab === 'events' ? 'events' : 'roster'}`)}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'overview' && <OverviewTab data={data} t={t} />}
      {activeTab === 'finances' && <FinancesTab data={data} t={t} />}
      {activeTab === 'events' && <EventsTab data={data} t={t} />}
      {activeTab === 'roster' && <RosterTab data={data} t={t} navigate={navigate} />}
    </div>
  );
}

// ─── KPI Card ──────────────────
function KPICard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ──────────────
function OverviewTab({ data, t }: { data: CoachStatsData; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Groups */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-xl">{t('coachProfile.groups')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.groups.map((group) => (
              <GroupCard key={group._id} group={group} t={t} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Distribution */}
      {data.attendance.total > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-xl mb-4">{t('coachProfile.attendanceDistribution')}</h3>
            <AttendanceDonut attendance={data.attendance} t={t} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Group Card ──────────────
function GroupCard({ group, t }: { group: CoachGroup; t: (key: string) => string }) {
  const rate = group.payments.collectionRate;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
          <span className="font-semibold text-lg">{group.name}</span>
          {group.ageGroup && <span className="text-sm text-muted-foreground">({group.ageGroup})</span>}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {group.memberCount} {t('coachProfile.members')}
        </span>
      </div>

      {/* Revenue bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('coachProfile.collection')}</span>
          <span className={`font-medium ${rate >= 80 ? 'text-green-500' : rate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
            {rate}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, rate)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatAmount(group.payments.paid)} RSD</span>
          <span>{formatAmount(group.payments.expected)} RSD</span>
        </div>
      </div>

      {/* Co-coaches */}
      {group.coaches.length > 1 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{t('coachProfile.coCoaches')}:</span>
          {group.coaches.map((c) => (
            <span key={c._id} className="font-medium text-foreground">{c.fullName}</span>
          )).reduce((prev, curr, i) => <>{prev}{i > 0 && ', '}{curr}</> as any)}
        </div>
      )}
    </div>
  );
}

// ─── Attendance Donut ─────────
function AttendanceDonut({ attendance, t }: { attendance: CoachStatsData['attendance']; t: (key: string) => string }) {
  const total = attendance.total || 1;
  const presentPct = Math.round(((attendance.present + attendance.late) / total) * 100);

  const items = [
    { label: t('coachProfile.present'), count: attendance.present, color: 'bg-green-500' },
    { label: t('coachProfile.late'), count: attendance.late, color: 'bg-orange-500' },
    { label: t('coachProfile.absent'), count: attendance.absent, color: 'bg-red-500' },
    { label: t('coachProfile.excused'), count: attendance.excused, color: 'bg-blue-500' },
  ];

  return (
    <div className="flex items-center gap-8">
      {/* Circle */}
      <div className="relative h-28 w-28 flex-shrink-0">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3"
          />
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" className="text-green-500" strokeWidth="3"
            strokeDasharray={`${presentPct}, 100`} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{presentPct}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3 flex-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${item.color}`} />
            <span className="text-base flex-1">{item.label}</span>
            <span className="text-base font-semibold">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Finances Tab ──────────────
function FinancesTab({ data, t }: { data: CoachStatsData; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.totalRevenue')}</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{formatAmount(data.kpi.totalRevenue)} <span className="text-sm font-normal">RSD</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.monthlyRevenue')}</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(data.kpi.monthlyRevenue)} <span className="text-sm font-normal">RSD</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.collectionRate')}</p>
            <p className={`text-2xl font-bold mt-1 ${data.kpi.collectionRate >= 80 ? 'text-green-500' : data.kpi.collectionRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
              {data.kpi.collectionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by group table */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-xl">{t('coachProfile.revenueByGroup')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 px-2 font-medium">{t('members.group')}</th>
                  <th className="text-right py-3 px-2 font-medium">{t('coachProfile.members')}</th>
                  <th className="text-right py-3 px-2 font-medium">{t('coachProfile.memberFee')}</th>
                  <th className="text-right py-3 px-2 font-medium">{t('coachProfile.expected')}</th>
                  <th className="text-right py-3 px-2 font-medium">{t('coachProfile.collected')}</th>
                  <th className="text-right py-3 px-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <tr key={group._id} className="border-b last:border-0">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="font-medium">{group.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">{group.memberCount}</td>
                    <td className="text-right py-3 px-2">{formatAmount(group.membershipFee)}</td>
                    <td className="text-right py-3 px-2">{formatAmount(group.payments.expected)}</td>
                    <td className="text-right py-3 px-2 font-medium">{formatAmount(group.payments.paid)}</td>
                    <td className="text-right py-3 px-2">
                      <span className={`font-semibold ${group.payments.collectionRate >= 80 ? 'text-green-500' : group.payments.collectionRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                        {group.payments.collectionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-3 px-2">{t('dashboard.totalBalance')}</td>
                  <td className="text-right py-3 px-2">{data.kpi.totalMembers}</td>
                  <td className="text-right py-3 px-2">—</td>
                  <td className="text-right py-3 px-2">{formatAmount(data.kpi.monthlyExpected)}</td>
                  <td className="text-right py-3 px-2">{formatAmount(data.kpi.monthlyRevenue)}</td>
                  <td className="text-right py-3 px-2">
                    <span className={data.kpi.collectionRate >= 80 ? 'text-green-500' : 'text-orange-500'}>
                      {data.kpi.collectionRate}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Events Tab ──────────────
function EventsTab({ data, t }: { data: CoachStatsData; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Event type stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.totalEvents')}</p>
            <p className="text-2xl font-bold mt-1">{data.events.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.eventsThisMonth')}</p>
            <p className="text-2xl font-bold mt-1">{data.events.thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.trainings')}</p>
            <p className="text-2xl font-bold mt-1">{data.events.byType['Trening'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">{t('coachProfile.matches')}</p>
            <p className="text-2xl font-bold mt-1">{data.events.byType['Utakmica'] || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-xl">{t('coachProfile.upcomingEvents')}</h3>
          {data.events.upcoming.length > 0 ? (
            <div className="space-y-3">
              {data.events.upcoming.map((event) => (
                <UpcomingEventRow key={event._id} event={event} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground text-center py-4">
              {t('coachProfile.noUpcomingEvents')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingEventRow({ event, t }: { event: CoachUpcomingEvent; t: (key: string) => string }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'sr' ? 'sr-Latn-RS' : 'en-US';
  const date = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const dateStr = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const timeStr = `${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-12 rounded-full"
          style={{ backgroundColor: event.groupColor || '#3b82f6' }}
        />
        <div>
          <p className="font-medium">{event.title}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeStr}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-muted">
          {event.groupName}
        </span>
        {event.confirmedCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            <CheckCircle className="inline h-3 w-3 text-green-500 mr-1" />
            {event.confirmedCount} {t('coachProfile.confirmed')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Roster Tab ──────────────
function RosterTab({ data, t, navigate }: { data: CoachStatsData; t: (key: string) => string; navigate: (path: string) => void }) {
  // Group members by their group
  const membersByGroup = useMemo(() => {
    const map = new Map<string, { group: CoachGroup; members: CoachMember[] }>();
    for (const group of data.groups) {
      map.set(group._id, { group, members: [] });
    }
    for (const member of data.members) {
      const groupId = member.groupId;
      if (groupId && map.has(groupId)) {
        map.get(groupId)!.members.push(member);
      }
    }
    return Array.from(map.values());
  }, [data.groups, data.members]);

  return (
    <div className="space-y-4">
      {membersByGroup.map(({ group, members }) => (
        <Card key={group._id}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
                <h3 className="font-semibold text-xl">{group.name}</h3>
                {group.ageGroup && <span className="text-sm text-muted-foreground">({group.ageGroup})</span>}
              </div>
              <span className="text-sm text-muted-foreground">
                {members.length} {t('coachProfile.members')}
              </span>
            </div>

            {members.length > 0 ? (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member._id}
                    onClick={() => navigate(`/profile/member/${member._id}`)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.profileImage || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.fullName}</p>
                      {member.position && (
                        <p className="text-sm text-muted-foreground">{member.position}</p>
                      )}
                    </div>
                    {member.jerseyNumber && (
                      <span className="text-sm font-mono text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" />
                        {member.jerseyNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-muted-foreground text-center py-4">
                {t('coachProfile.noMembers')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
