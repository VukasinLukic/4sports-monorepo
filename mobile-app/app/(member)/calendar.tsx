import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import EventCalendar from '@/components/EventCalendar';
import DropdownMenu from '@/components/DropdownMenu';
import api from '@/services/api';
import { Event, Group } from '@/types';

type FilterType = 'all' | 'training' | 'competition';

// Helper function to get relative time text
const getRelativeTimeText = (eventDate: Date, t: any): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('dateTime.today') || 'Danas';
  if (diffDays === 1) return t('dateTime.tomorrow') || 'Sutra';
  if (diffDays === -1) return 'Juče';
  if (diffDays > 1 && diffDays <= 7) return `${t('time.in') || 'Za'} ${diffDays} ${t('time.days') || 'dana'}`;
  if (diffDays > 7) return `${t('time.in') || 'Za'} ${Math.floor(diffDays / 7)} ${t('time.weeks') || 'ned.'}`;

  return '';
};

// Helper function to get event type color for any type string
const getEventTypeColorFromString = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return Colors.eventTraining || Colors.primary;
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ')) {
    return Colors.eventCompetition || Colors.warning;
  }
  if (upperType === 'OTHER') {
    return Colors.eventMeeting || Colors.info;
  }
  return Colors.primary;
};

export default function MemberCalendar() {
  const { t } = useLanguage();
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
      // Fetch events for member's group
      const response = await api.get('/events/me');
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback: try to fetch upcoming events
      try {
        const fallbackResponse = await api.get('/events/upcoming', { params: { limit: 50 } });
        setEvents(fallbackResponse.data.data || []);
      } catch {
        setEvents([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchEvents();
  }, [fetchGroups, fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const getSelectedGroupName = () => {
    if (!selectedGroupId) return t('groups.allGroups') || 'Sve grupe';
    const group = groups.find(g => g._id === selectedGroupId);
    return group?.name || t('groups.allGroups') || 'Sve grupe';
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  // Filter events by type
  const filteredEvents = events.filter(event => {
    const upperType = event.type?.toUpperCase() || '';

    // Filter by group
    if (selectedGroupId) {
      const eventGroupId = typeof event.groupId === 'object' ? event.groupId._id : event.groupId;
      if (eventGroupId !== selectedGroupId) return false;
    }

    // Filter by type
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
    (a, b) => new Date(getEventDate(a) || '').getTime() - new Date(getEventDate(b) || '').getTime()
  );

  const navigateToEvent = (eventId: string) => {
    router.push({ pathname: '/(member)/events/[id]', params: { id: eventId } });
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
        />

        {/* Group Filter */}
        <View style={styles.groupFilterContainer}>
          <DropdownMenu
            visible={groupMenuVisible}
            onDismiss={() => setGroupMenuVisible(false)}
            onSelect={(key) => {
              setSelectedGroupId(key === 'all' ? null : key);
            }}
            items={[
              { key: 'all', title: t('groups.allGroups') || 'Sve grupe', selected: selectedGroupId === null },
              ...groups.map(group => ({
                key: group._id,
                title: group.name,
                selected: selectedGroupId === group._id,
              })),
            ]}
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
          />
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
            {t('common.all') || 'Sve'}
          </Chip>
          <Chip
            selected={filter === 'training'}
            style={[styles.filterChip, filter === 'training' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventTraining}
            onPress={() => setFilter('training')}
          >
            {t('eventTypes.training') || 'Trening'}
          </Chip>
          <Chip
            selected={filter === 'competition'}
            style={[styles.filterChip, filter === 'competition' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventCompetition}
            onPress={() => setFilter('competition')}
          >
            {t('eventTypes.match') || 'Utakmica'}
          </Chip>
        </View>

        {/* Events List Section */}
        <Text style={styles.sectionTitle}>
          {selectedDate
            ? `${t('events.eventsOn') || 'Događaji'} ${new Date(selectedDate).toLocaleDateString()}`
            : t('dashboard.upcomingEvents') || 'Predstojeći događaji'}
        </Text>

        {sortedEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {selectedDate
                  ? t('empty.noEventsOnDay') || 'Nema događaja za ovaj dan'
                  : t('empty.noUpcomingEvents') || 'Nema predstojećih događaja'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          sortedEvents.map(event => {
            const eventDate = new Date(event.date || event.startTime);
            const dayNumber = eventDate.getDate();
            const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
            const dayName = t(`dateTime.days.${dayKeys[eventDate.getDay()]}`);
            const groupName = typeof event.groupId === 'object' ? event.groupId.name : '';
            const groupColor = typeof event.groupId === 'object' ? event.groupId.color : Colors.primary;
            const relativeTime = getRelativeTimeText(eventDate, t);

            return (
              <TouchableOpacity
                key={event._id}
                onPress={() => navigateToEvent(event._id)}
                activeOpacity={0.7}
              >
                <Card style={styles.eventCard}>
                  <Card.Content style={styles.eventCardContent}>
                    {/* Date Column */}
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

                      {/* Group Name */}
                      {groupName && (
                        <View style={styles.groupRow}>
                          <View style={[styles.groupDot, { backgroundColor: groupColor || Colors.primary }]} />
                          <Text style={[styles.groupName, { color: groupColor || Colors.primary }]}>{groupName}</Text>
                        </View>
                      )}

                      {/* Location or relative time */}
                      {event.location ? (
                        <View style={styles.eventMeta}>
                          <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                        </View>
                      ) : relativeTime ? (
                        <View style={styles.eventMeta}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventLocation}>{relativeTime}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      {/* NO FAB - Members cannot create events */}
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
    paddingBottom: Spacing.xxl,
  },
  groupFilterContainer: {
    marginTop: Spacing.md,
  },
  groupFilterButton: {
    borderColor: Colors.border,
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
    textAlign: 'center',
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
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
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
    flex: 1,
  },
});
