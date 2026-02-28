import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, FAB, Chip, ActivityIndicator, Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useAuth } from '@/services/AuthContext';
import EventCalendar from '@/components/EventCalendar';
import api from '@/services/api';
import { Event, Group } from '@/types';

type FilterType = 'all' | 'training' | 'competition';

// Helper function to get relative time text
const getRelativeTimeText = (eventDate: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Danas';
  if (diffDays === 1) return 'Sutra';
  if (diffDays === -1) return 'Juče';
  if (diffDays > 1 && diffDays <= 7) return `Za ${diffDays} dana`;
  if (diffDays > 7) return `Za ${Math.floor(diffDays / 7)} ned.`;
  if (diffDays < -1) return `Pre ${Math.abs(diffDays)} dana`;

  return '';
};

// Helper function to get event type color for any type string
const getEventTypeColorFromString = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return Colors.eventTraining;
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ')) {
    return Colors.eventCompetition;
  }
  if (upperType === 'OTHER') {
    return Colors.eventMeeting;
  }
  // Return primary color for custom types
  return Colors.primary;
};

export default function CoachCalendar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      // Always fetch ALL club events (not filtered by group)
      // so coach can see other groups' events for scheduling conflicts
      const response = await api.get('/events');
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const getSelectedGroupName = () => {
    if (!selectedGroupId) return t('groups.allGroups');
    const group = groups.find(g => g._id === selectedGroupId);
    return group?.name || t('groups.allGroups');
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };


  // Filter events by type and selected group (handles string types)
  const filteredEvents = events.filter(event => {
    // Filter by selected group if any
    if (selectedGroupId) {
      const eventGroupId = typeof event.groupId === 'object' ? event.groupId._id : event.groupId;
      if (eventGroupId !== selectedGroupId) return false;
    }

    // Filter by type
    const upperType = event.type?.toUpperCase() || '';
    if (filter === 'training') {
      return upperType === 'TRAINING' || upperType.includes('TRENING');
    }
    if (filter === 'competition') {
      return upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ');
    }
    return true;
  });

  // Filter by selected date if any
  const getEventDate = (event: Event) => event.date || event.startTime;

  const displayedEvents = selectedDate
    ? filteredEvents.filter(event => {
        const eventDate = getEventDate(event);
        return eventDate && eventDate.startsWith(selectedDate);
      })
    : filteredEvents.filter(event => {
        const eventDate = getEventDate(event);
        return eventDate && new Date(eventDate) >= new Date(new Date().setHours(0, 0, 0, 0));
      });

  // Sort by date
  const sortedEvents = displayedEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleDayPress = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const navigateToEvent = (eventId: string) => {
    router.push(`/(coach)/events/${eventId}`);
  };

  // Check if current user is coach of this event's group
  const isMyEvent = (event: Event): boolean => {
    if (!user?._id || typeof event.groupId !== 'object') return true;
    const coaches = event.groupId.coaches || [];
    return coaches.some((coachId: any) => {
      const id = typeof coachId === 'string' ? coachId : coachId._id || coachId;
      return id === user._id;
    });
  };

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatEventDate = (event: Event) => {
    try {
      const dateString = event.date || event.startTime;
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('calendar.loadingCalendar')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Calendar */}
        <EventCalendar
          events={events}
          selectedDate={selectedDate}
          onDayPress={handleDayPress}
          userId={user?._id}
        />

        {/* Group Filter */}
        <View style={styles.groupFilterContainer}>
          <Menu
            visible={groupMenuVisible}
            onDismiss={() => setGroupMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setGroupMenuVisible(true)}
                icon="filter-variant"
                textColor={Colors.text}
                style={styles.groupFilterButton}
              >
                {getSelectedGroupName()}
              </Button>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => {
                setSelectedGroupId(null);
                setGroupMenuVisible(false);
              }}
              title={t('groups.allGroups')}
              leadingIcon={selectedGroupId === null ? 'check' : undefined}
            />
            {groups.map(group => (
              <Menu.Item
                key={group._id}
                onPress={() => {
                  setSelectedGroupId(group._id);
                  setGroupMenuVisible(false);
                }}
                title={group.name}
                leadingIcon={selectedGroupId === group._id ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>

        {/* Type Filter Chips */}
        <View style={styles.filterRow}>
          <Chip
            selected={filter === 'all'}
            style={[styles.filterChip, filter === 'all' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.primary}
            onPress={() => setFilter('all')}
          >
            {t('common.all')}
          </Chip>
          <Chip
            selected={filter === 'training'}
            style={[styles.filterChip, filter === 'training' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventTraining}
            onPress={() => setFilter('training')}
          >
            {t('eventTypes.training')}
          </Chip>
          <Chip
            selected={filter === 'competition'}
            style={[styles.filterChip, filter === 'competition' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventCompetition}
            onPress={() => setFilter('competition')}
          >
            {t('eventTypes.match')}
          </Chip>
        </View>

        {/* Events List Section */}
        <Text style={styles.sectionTitle}>
          {selectedDate
            ? `${t('events.eventsOn')} ${new Date(selectedDate).toLocaleDateString()}`
            : t('dashboard.upcomingEvents')}
        </Text>

        {sortedEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {selectedDate ? t('empty.noEventsOnDay') : t('empty.noUpcomingEvents')}
              </Text>
              <Text style={styles.emptySubtext}>{t('empty.tapToCreateEvent')}</Text>
            </Card.Content>
          </Card>
        ) : (
          sortedEvents.map(event => {
            const eventDate = new Date(event.date || event.startTime);
            const dayNumber = eventDate.getDate();
            const dayName = eventDate.toLocaleDateString('sr-RS', { weekday: 'short' });
            const groupName = typeof event.groupId === 'object' ? event.groupId.name : '';
            const groupColor = typeof event.groupId === 'object' ? event.groupId.color : Colors.primary;
            const relativeTime = getRelativeTimeText(eventDate);
            const isOwn = isMyEvent(event);

            return (
              <TouchableOpacity
                key={event._id}
                onPress={() => navigateToEvent(event._id)}
                activeOpacity={0.7}
                style={{ opacity: isOwn ? 1 : 0.4 }}
              >
                <Card style={styles.eventCard}>
                  <Card.Content style={styles.eventCardContent}>
                    {/* Date Column - Compact */}
                    <View style={[styles.dateColumn, { backgroundColor: getEventTypeColorFromString(event.type) }]}>
                      <Text style={styles.dateDay}>{dayNumber}</Text>
                      <Text style={styles.dateDayName}>{dayName}</Text>
                    </View>

                    {/* Event Info */}
                    <View style={styles.eventInfo}>
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.eventTime}>
                          {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                        </Text>
                      </View>

                      {/* Group Name - colored with group color */}
                      {groupName && (
                        <View style={styles.groupRow}>
                          <View style={[styles.groupDot, { backgroundColor: groupColor || Colors.primary }]} />
                          <Text style={[styles.groupName, { color: groupColor || Colors.primary }]}>{groupName}</Text>
                        </View>
                      )}

                      {/* Relative Time instead of location */}
                      {relativeTime && (
                        <View style={styles.eventMeta}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventLocation}>{relativeTime}</Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB for creating new event */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.text}
        onPress={() => router.push({
          pathname: '/(coach)/events/create',
          params: selectedDate ? { date: selectedDate } : {},
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  groupFilterContainer: {
    marginTop: Spacing.md,
  },
  groupFilterButton: {
    borderColor: Colors.border,
  },
  menuContent: {
    backgroundColor: Colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary + '30',
  },
  filterChipText: {
    fontSize: FontSize.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  eventCardContent: {
    flexDirection: 'row',
    padding: 0,
    alignItems: 'flex-start',
  },
  dateColumn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm2,
    marginLeft: Spacing.sm,
    // marginBottom: Spacing.,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateDayName: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  eventInfo: {
    flex: 1,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  eventTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  groupName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  eventLocation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
});
