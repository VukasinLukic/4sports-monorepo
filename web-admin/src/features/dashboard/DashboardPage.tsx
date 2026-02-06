import { useEffect } from 'react';
import { DollarSign, Users, Calendar, AlertCircle, HeartPulse, UsersRound, CalendarDays, Clock, MapPin } from 'lucide-react';
import { useDashboard, UpcomingEvent } from './useDashboard';
import { KPICard } from './KPICard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { HelpButton } from '@/components/shared/HelpButton';
import { useOnboarding } from '@/context/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

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

const formatEventDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Danas';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Sutra';
    }
    return date.toLocaleDateString('sr-RS', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

export const DashboardPage = () => {
  const { data, isLoading, error, refetch } = useDashboard();
  const { checkAndStartTutorial } = useOnboarding();

  useEffect(() => {
    if (!isLoading && data) {
      checkAndStartTutorial('dashboard');
    }
  }, [isLoading, data, checkAndStartTutorial]);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <ErrorMessage
          message="Failed to load dashboard data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your club overview.</p>
      </div>

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
              title="Ukupno članova"
              value={data.totalMembers}
              icon={Users}
            />
            <KPICard
              title="Ukupno grupa"
              value={data.totalGroups}
              icon={UsersRound}
            />
            <KPICard
              title="Događaji danas"
              value={data.eventsToday}
              icon={Calendar}
            />
            <KPICard
              title="Ukupan prihod"
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
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Neplaćene članarine</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{data.unpaidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.medicalDueCount > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <HeartPulse className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Lekarski pregledi ističu</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{data.medicalDueCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      {!isLoading && data && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Predstojeći događaji
            </CardTitle>
            <Link to="/calendar" className="text-sm text-primary hover:underline">
              Vidi sve
            </Link>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nema predstojećih događaja</p>
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
                          {event.confirmedCount} potvrđeno
                        </Badge>
                        {event.pendingCount > 0 && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {event.pendingCount} čeka
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
