import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  Filter,
} from 'lucide-react';
import { useEvents, useGroups, useDeleteEvent, Event, Group } from './useEvents';
import { CreateEventDialog } from './CreateEventDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateStr = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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

export function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const DAYS_OF_WEEK = t('calendar.days', { returnObjects: true }) as string[];
  const MONTHS = t('calendar.months', { returnObjects: true }) as string[];

  const { data: events, isLoading, error, refetch } = useEvents(
    selectedGroupId !== 'all' ? { groupId: selectedGroupId } : undefined
  );
  const { data: groups } = useGroups();
  const deleteEventMutation = useDeleteEvent();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    const dateStr = toLocalDateStr(date);
    return events.filter((event) => {
      const eventDate = event.startTime?.split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;

    if (filterType === 'training') {
      filtered = filtered.filter((e) =>
        e.type?.toUpperCase() === 'TRAINING' || e.type?.toUpperCase().includes('TRENING')
      );
    } else if (filterType === 'match') {
      filtered = filtered.filter((e) =>
        e.type?.toUpperCase() === 'MATCH' || e.type?.toUpperCase().includes('UTAKMICA')
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((e) => e.startTime?.startsWith(selectedDate));
    } else {
      // Show upcoming events
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      filtered = filtered.filter((e) => new Date(e.startTime) >= now);
    }

    return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, filterType, selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventMutation.mutateAsync(eventToDelete._id);
      toast({
        title: t('common.success'),
        description: t('calendar.eventDeleted'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('calendar.eventDeleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('calendar.title')}</h1>
            <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
          </div>
        </div>
        <ErrorMessage message="Failed to load events" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('calendar.newEvent')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  {t('calendar.today')}
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <>
                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    const dateStr = toLocalDateStr(date);
                    const dayEvents = getEventsForDate(date);
                    const isSelected = selectedDate === dateStr;
                    const isTodayDate = isToday(date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`
                          min-h-[80px] p-1 rounded-lg border text-left transition-colors
                          ${isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                          ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                          ${isTodayDate ? 'bg-primary/10' : ''}
                          hover:bg-accent/50
                        `}
                      >
                        <div
                          className={`
                            text-sm font-medium mb-1
                            ${isTodayDate ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}
                          `}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event._id}
                              className={`${getEventTypeColor(event.type)} text-white text-xs px-1 py-0.5 rounded truncate`}
                            >
                              {formatEventTime(event.startTime)}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedDate
                  ? t('calendar.eventsOnDate', { date: parseLocalDateStr(selectedDate).toLocaleDateString('sr-RS') })
                  : t('calendar.upcomingEvents')}
              </CardTitle>
              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                  {t('calendar.showAll')}
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mt-2">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('calendar.allGroups')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('calendar.allGroups')}</SelectItem>
                  {groups?.map((group: Group) => (
                    <SelectItem key={group._id} value={group._id}>
                      <div className="flex items-center gap-2">
                        {group.color && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('calendar.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('calendar.allTypes')}</SelectItem>
                  <SelectItem value="training">{t('calendar.trainings')}</SelectItem>
                  <SelectItem value="match">{t('calendar.matches')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{selectedDate ? t('calendar.noEventsOnDay') : t('calendar.noUpcomingEvents')}</p>
                {selectedDate && (
                  <Button
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('calendar.addNew')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredEvents.map((event) => {
                  const groupName = typeof event.groupId === 'object' ? event.groupId.name : '';
                  const groupColor = typeof event.groupId === 'object' ? event.groupId.color : '#3b82f6';

                  return (
                    <div
                      key={event._id}
                      className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/calendar/${event._id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${getEventTypeColor(event.type)} text-white text-xs`}>
                              {event.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.startTime).toLocaleDateString('sr-RS', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: groupColor || '#3b82f6' }}
                            />
                            <span>{groupName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
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
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(event); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedDate={selectedDate ? parseLocalDateStr(selectedDate) : undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.deleteEvent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('calendar.deleteEventConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
