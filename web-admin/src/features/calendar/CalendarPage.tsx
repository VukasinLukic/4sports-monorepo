import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Trash2,
  Filter,
  Pencil,
  Clock,
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

const normalizeEventType = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return 'Trening';
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA')) {
    return 'Utakmica';
  }
  return type;
};

const getEventTypeColor = (type: string): string => {
  const normalized = normalizeEventType(type);
  if (normalized === 'Trening') {
    return 'bg-green-500';
  }
  if (normalized === 'Utakmica') {
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

const getTimeUntilEvent = (dateString: string): string => {
  const eventDate = new Date(dateString);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 0) return 'Prošlo';
  if (diffMinutes < 60) return `Za ${diffMinutes} min`;
  if (diffHours < 24) return `Za ${diffHours}h`;
  if (diffDays === 0) return 'Danas';
  if (diffDays === 1) return 'Sutra';
  if (diffDays < 7) return `Za ${diffDays} dana`;
  return `Za ${Math.floor(diffDays / 7)} ned`;
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
  const [deleteMode, setDeleteMode] = useState<'this' | 'future' | 'all'>('this');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  // Get unique event types (normalized)
  const eventTypes = useMemo(() => {
    if (!events) return [];
    const types = new Set<string>();
    events.forEach((e) => {
      if (e.type) types.add(normalizeEventType(e.type));
    });
    return Array.from(types);
  }, [events]);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;

    if (filterType !== 'all') {
      filtered = filtered.filter((e) => normalizeEventType(e.type) === filterType);
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
    setDeleteMode('this');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    const isRecurringSeries = !!(eventToDelete.isRecurring || eventToDelete.parentEventId);

    try {
      await deleteEventMutation.mutateAsync({
        id: eventToDelete._id,
        deleteMode: isRecurringSeries ? deleteMode : 'this',
      });
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
            <div className="flex flex-col gap-3 mt-2">
              {/* Event Type Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs ${filterType === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  {t('calendar.allTypes')}
                </Button>
                {eventTypes.map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs ${filterType === type ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>

              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-full h-9">
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
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(34, 197, 94) transparent',
              }}>
                <style>{`
                  div[style*="scrollbar-color"] ::-webkit-scrollbar {
                    width: 6px;
                  }
                  div[style*="scrollbar-color"] ::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div[style*="scrollbar-color"] ::-webkit-scrollbar-thumb {
                    background-color: rgb(34, 197, 94);
                    border-radius: 3px;
                  }
                  div[style*="scrollbar-color"] ::-webkit-scrollbar-thumb:hover {
                    background-color: rgb(22, 163, 74);
                  }
                `}</style>
                {filteredEvents.map((event) => {
                  const groupName = typeof event.groupId === 'object' ? event.groupId.name : '';
                  const groupColor = typeof event.groupId === 'object' ? event.groupId.color : '#22c55e';
                  const eventDate = new Date(event.startTime);
                  const dayOfWeek = eventDate.toLocaleDateString('sr-RS', { weekday: 'short' }).toUpperCase();
                  const dayOfMonth = eventDate.getDate();
                  const eventTypeColor = getEventTypeColor(event.type);
                  const timeUntil = getTimeUntilEvent(event.startTime);

                  return (
                    <div
                      key={event._id}
                      className="relative flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/calendar/${event._id}`)}
                    >
                      {/* Date Badge */}
                      <div className={`${eventTypeColor} text-white rounded-sm p-2 flex flex-col items-center justify-center min-w-[50px] font-medium shrink-0 self-start`}>
                        <div className="text-xl font-bold leading-none">{dayOfMonth}</div>
                        <div className="text-[10px] mt-0.5">{dayOfWeek}</div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>

                        {groupName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: groupColor }}
                            />
                            <span>{groupName}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{timeUntil}</span>
                        </div>
                      </div>

                      {/* Time and Actions */}
                      <div className="flex flex-col items-end gap-2 self-start absolute top-3 right-3 z-50">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="hover:bg-green-800 h-7 w-7 inline-flex items-center justify-center rounded-md text-primary hover:bg-accent transition-colors cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onMouseUp={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingEvent(event);
                              setCreateDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onMouseUp={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteClick(event);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
                          </button>
                        </div>
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
        onOpenChange={(isOpen) => {
          setCreateDialogOpen(isOpen);
          if (!isOpen) {
            setEditingEvent(null);
          }
        }}
        selectedDate={selectedDate ? parseLocalDateStr(selectedDate) : undefined}
        event={editingEvent}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(eventToDelete?.isRecurring || eventToDelete?.parentEventId)
                ? t('calendar.deleteRecurringTitle')
                : t('calendar.deleteEvent')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(eventToDelete?.isRecurring || eventToDelete?.parentEventId)
                ? t('calendar.deleteRecurringDesc')
                : t('calendar.deleteEventConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(eventToDelete?.isRecurring || eventToDelete?.parentEventId) && (
            <div className="flex flex-col gap-2 py-2">
              {(['this', 'future', 'all'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeleteMode(mode)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors',
                    deleteMode === mode
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0',
                    deleteMode === mode ? 'border-destructive bg-destructive' : 'border-muted-foreground'
                  )} />
                  {mode === 'this' && t('calendar.deleteThis')}
                  {mode === 'future' && t('calendar.deleteFuture')}
                  {mode === 'all' && t('calendar.deleteAll')}
                </button>
              ))}
            </div>
          )}

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
