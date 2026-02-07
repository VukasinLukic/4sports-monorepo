import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Users, Calendar, AlertCircle, HeartPulse, UsersRound, CalendarDays, Clock, MapPin, TrendingUp, Activity } from 'lucide-react';
import { useDashboard, UpcomingEvent } from './useDashboard';
import { KPICard } from './KPICard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { HelpButton } from '@/components/shared/HelpButton';
import { useOnboarding } from '@/context/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const getEventTypeColor = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return 'bg-green-500';
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA')) {
    return 'bg-red-500';
  }
  return 'bg-blue-500';
};

const formatEventTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useDashboard();
  const { checkAndStartTutorial } = useOnboarding();

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return t('common.today');
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return t('common.tomorrow');
      }
      return date.toLocaleDateString('sr-RS', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!isLoading && data) {
      checkAndStartTutorial('dashboard');
    }
  }, [isLoading, data, checkAndStartTutorial]);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        <ErrorMessage
          message={t('errors.loadDashboard')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Prepare chart data from real data
  const getEventTypeDistribution = () => {
    if (!data?.upcomingEvents?.length) return [];
    const typeCounts: Record<string, number> = {};
    data.upcomingEvents.forEach((event) => {
      const type = event.type || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

  const getAttendanceStats = () => {
    if (!data?.upcomingEvents?.length) return [];
    return data.upcomingEvents.slice(0, 5).map((event) => ({
      name: event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title,
      confirmed: event.confirmedCount,
      pending: event.pendingCount,
    }));
  };

  const eventTypeData = getEventTypeDistribution();
  const attendanceData = getAttendanceStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcomeSubtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div data-tour="stats-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data ? (
          <>
            <KPICard
              title={t('dashboard.totalMembers')}
              value={data.totalMembers}
              icon={Users}
            />
            <KPICard
              title={t('dashboard.totalGroups')}
              value={data.totalGroups}
              icon={UsersRound}
            />
            <KPICard
              title={t('dashboard.eventsToday')}
              value={data.eventsToday}
              icon={Calendar}
            />
            <KPICard
              title={t('dashboard.totalRevenue')}
              value={`${data.totalRevenue.toLocaleString()} RSD`}
              icon={DollarSign}
            />
          </>
        ) : null}
      </div>

      {/* Alerts Row */}
      {!isLoading && data && (data.unpaidCount > 0 || data.medicalDueCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.unpaidCount > 0 && (
            <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 dark:border-orange-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-200 dark:bg-orange-800/50 rounded-full">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">{t('dashboard.unpaidMemberships')}</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{data.unpaidCount}</p>
                  </div>
                  <Link
                    to="/finances"
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    {t('common.seeAll')} &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {data.medicalDueCount > 0 && (
            <Card className="border-red-300 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 dark:border-red-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-200 dark:bg-red-800/50 rounded-full">
                    <HeartPulse className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{t('dashboard.medicalExpiring')}</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{data.medicalDueCount}</p>
                  </div>
                  <Link
                    to="/members"
                    className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                  >
                    {t('common.seeAll')} &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Row */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                {t('dashboard.eventTypes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventTypeData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      >
                        {eventTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, t('dashboard.eventTypes')]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('dashboard.noUpcomingEvents')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                {t('dashboard.attendanceByEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="confirmed" name={t('status.confirmed')} fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="pending" name={t('status.pending')} fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('dashboard.noAttendanceData')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats Row */}
      {!isLoading && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{data.totalEvents}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.totalEvents')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {data.upcomingEvents.reduce((acc, e) => acc + e.confirmedCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('dashboard.confirmedAttendances')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {data.upcomingEvents.reduce((acc, e) => acc + e.pendingCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('dashboard.pendingStatus')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{data.upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.upcomingEvents')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Events */}
      {!isLoading && data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t('dashboard.upcomingEvents')}
            </CardTitle>
            <Link to="/calendar" className="text-sm text-primary hover:underline">
              {t('common.viewAll')}
            </Link>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('dashboard.noUpcomingEvents')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingEvents.map((event: UpcomingEvent) => (
                  <div
                    key={event._id}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={`${getEventTypeColor(event.type)} text-white rounded-lg p-3 text-center min-w-[60px]`}
                    >
                      <div className="text-lg font-bold">
                        {new Date(event.startTime).getDate()}
                      </div>
                      <div className="text-xs uppercase">
                        {new Date(event.startTime).toLocaleDateString('sr-RS', { weekday: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{event.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatEventDate(event.startTime)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.groupColor || '#3b82f6' }}
                        />
                        <span>{event.groupName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {t('dashboard.confirmedCount', { count: event.confirmedCount })}
                        </Badge>
                        {event.pendingCount > 0 && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {t('dashboard.pendingCount', { count: event.pendingCount })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <HelpButton pageKey="dashboard" />
    </div>
  );
};
