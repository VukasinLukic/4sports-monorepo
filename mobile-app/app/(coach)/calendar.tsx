import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, FAB, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import EventCalendar from '@/components/EventCalendar';
import api from '@/services/api';
import { Event, EventType } from '@/types';

type FilterType = 'all' | 'training' | 'competition';

export default function CoachCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
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
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case EventType.TRAINING:
        return Colors.eventTraining;
      case EventType.COMPETITION:
        return Colors.eventCompetition;
      case EventType.MEETING:
        return Colors.eventMeeting;
      default:
        return Colors.primary;
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter === 'training') return event.type === EventType.TRAINING;
    if (filter === 'competition') return event.type === EventType.COMPETITION;
    return true;
  });

  // Filter by selected date if any
  const displayedEvents = selectedDate
    ? filteredEvents.filter(event => event.date.startsWith(selectedDate))
    : filteredEvents.filter(event => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0)));

  // Sort by date
  const sortedEvents = displayedEvents.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleDayPress = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const navigateToEvent = (eventId: string) => {
    router.push(`/(coach)/attendance/${eventId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading calendar...</Text>
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

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <Chip
            selected={filter === 'all'}
            style={[styles.filterChip, filter === 'all' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.primary}
            onPress={() => setFilter('all')}
          >
            All
          </Chip>
          <Chip
            selected={filter === 'training'}
            style={[styles.filterChip, filter === 'training' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventTraining}
            onPress={() => setFilter('training')}
          >
            Training
          </Chip>
          <Chip
            selected={filter === 'competition'}
            style={[styles.filterChip, filter === 'competition' && styles.filterChipSelected]}
            textStyle={styles.filterChipText}
            selectedColor={Colors.eventCompetition}
            onPress={() => setFilter('competition')}
          >
            Competition
          </Chip>
        </View>

        {/* Events List Section */}
        <Text style={styles.sectionTitle}>
          {selectedDate
            ? `Events on ${new Date(selectedDate).toLocaleDateString()}`
            : 'Upcoming Events'}
        </Text>

        {sortedEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {selectedDate ? 'No events on this day' : 'No upcoming events'}
              </Text>
              <Text style={styles.emptySubtext}>Tap + to create a new event</Text>
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
                      {event.startTime} - {event.endTime}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventMeta}>
                    <MaterialCommunityIcons name="calendar" size={16} color={Colors.textSecondary} />
                    <Text style={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
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
