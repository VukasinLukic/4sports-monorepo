import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, FAB, Chip, ActivityIndicator, Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import EventCalendar from '@/components/EventCalendar';
import api from '@/services/api';
import { Event, EventType, Group } from '@/types';

type FilterType = 'all' | 'training' | 'competition';

export default function CoachCalendar() {
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
      const params: Record<string, string> = {};
      if (selectedGroupId) params.groupId = selectedGroupId;

      const response = await api.get('/events', { params });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedGroupId]);

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

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case EventType.TRAINING:
        return Colors.eventTraining;
      case EventType.MATCH:
        return Colors.eventCompetition;
      case EventType.OTHER:
        return Colors.eventMeeting;
      default:
        return Colors.primary;
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter === 'training') return event.type === EventType.TRAINING;
    if (filter === 'competition') return event.type === EventType.MATCH;
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
          sortedEvents.map(event => (
            <TouchableOpacity
              key={event._id}
              onPress={() => navigateToEvent(event._id)}
              activeOpacity={0.7}
            >
              <Card style={styles.eventCard}>
                <Card.Content>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
                      <Text style={styles.eventTypeText}>{event.type}</Text>
                    </View>
                    <Text style={styles.eventTime}>
                      {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventMeta}>
                    <MaterialCommunityIcons name="calendar" size={16} color={Colors.textSecondary} />
                    <Text style={styles.eventDate}>
                      {formatEventDate(event)}
                    </Text>
                  </View>
                  {event.location && (
                    <View style={styles.eventMeta}>
                      <MaterialCommunityIcons name="map-marker" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB for creating new event */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.text}
        onPress={() => router.push('/(coach)/events/create')}
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
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eventTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  eventTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  eventTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  eventDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventLocation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
});
