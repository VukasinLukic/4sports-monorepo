import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import EventCalendar from '@/components/EventCalendar';
import api from '@/services/api';
import { Event, EventType } from '@/types';

export default function ParentCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch events for parent's children
      const response = await api.get('/events/my-children');
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

  const handleDayPress = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter events for selected date
  const selectedDateEvents = selectedDate
    ? events.filter(event => event.date.split('T')[0] === selectedDate)
    : [];

  // Get upcoming events (next 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.eventTraining }]} />
            <Text style={styles.legendText}>Training</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.eventCompetition }]} />
            <Text style={styles.legendText}>Competition</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.eventMeeting }]} />
            <Text style={styles.legendText}>Meeting</Text>
          </View>
        </View>

        {/* Selected Date Events */}
        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>
              {formatDate(selectedDate)}
            </Text>
            {selectedDateEvents.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="calendar-blank" size={32} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No events on this day</Text>
                </Card.Content>
              </Card>
            ) : (
              selectedDateEvents.map(event => (
                <Card key={event._id} style={styles.eventCard}>
                  <Card.Content>
                    <View style={styles.eventHeader}>
                      <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.type) + '20' }]}>
                        <Text style={[styles.eventTypeText, { color: getEventTypeColor(event.type) }]}>
                          {event.type}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMeta}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.eventMetaText}>{event.startTime} - {event.endTime}</Text>
                    </View>
                    {event.location && (
                      <View style={styles.eventMeta}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.eventMetaText}>{event.location}</Text>
                      </View>
                    )}
                    {event.description && (
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </>
        )}

        {/* Upcoming Events Section */}
        {!selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {upcomingEvents.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No upcoming events</Text>
                  <Text style={styles.emptySubtext}>Events scheduled by your club will appear here</Text>
                </Card.Content>
              </Card>
            ) : (
              upcomingEvents.map(event => {
                const eventDate = new Date(event.date);
                return (
                  <Card key={event._id} style={styles.eventCard}>
                    <Card.Content style={styles.eventCardContent}>
                      <View style={styles.eventDate}>
                        <Text style={styles.eventDay}>{eventDate.getDate()}</Text>
                        <Text style={styles.eventMonth}>
                          {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.eventDetails}>
                        <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.type) + '20' }]}>
                          <Text style={[styles.eventTypeText, { color: getEventTypeColor(event.type) }]}>
                            {event.type}
                          </Text>
                        </View>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.eventMeta}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventMetaText}>{event.startTime} - {event.endTime}</Text>
                        </View>
                        {event.location && (
                          <View style={styles.eventMeta}>
                            <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textSecondary} />
                            <Text style={styles.eventMetaText}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
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
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
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
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  eventCardContent: {
    flexDirection: 'row',
  },
  eventDate: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    minWidth: 50,
  },
  eventDay: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  eventMonth: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  eventDetails: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  eventTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
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
    gap: Spacing.xs,
    marginTop: 4,
  },
  eventMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
