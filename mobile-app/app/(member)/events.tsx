import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Event, EventType } from '@/types';

export default function MemberEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/events/upcoming', { params: { limit: 30 } });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const getEventTypeInfo = (type: EventType) => {
    switch (type) {
      case EventType.TRAINING:
        return { color: Colors.primary, label: 'Training', icon: 'run' as const };
      case EventType.MATCH:
        return { color: Colors.success, label: 'Match', icon: 'trophy' as const };
      case EventType.OTHER:
        return { color: Colors.info, label: 'Other', icon: 'calendar' as const };
      default:
        return { color: Colors.textSecondary, label: 'Event', icon: 'calendar' as const };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const typeInfo = getEventTypeInfo(item.type);
    const eventIsToday = isToday(item.startTime);

    return (
      <Card style={[styles.eventCard, eventIsToday && styles.todayCard]}>
        <Card.Content>
          <View style={styles.eventHeader}>
            <View style={styles.eventTitleRow}>
              <View style={[styles.typeIndicator, { backgroundColor: typeInfo.color }]} />
              <Text style={styles.eventTitle}>{item.title}</Text>
            </View>
            {eventIsToday && (
              <Chip style={styles.todayChip} textStyle={styles.todayChipText}>
                Today
              </Chip>
            )}
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{formatDate(item.startTime)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                {formatTime(item.startTime)} - {formatTime(item.endTime)}
              </Text>
            </View>
            {item.location && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.eventFooter}>
            <Chip
              style={[styles.typeChip, { backgroundColor: typeInfo.color + '20' }]}
              textStyle={[styles.typeChipText, { color: typeInfo.color }]}
              icon={() => (
                <MaterialCommunityIcons name={typeInfo.icon} size={14} color={typeInfo.color} />
              )}
            >
              {typeInfo.label}
            </Chip>
            {item.isMandatory && (
              <Text style={styles.mandatoryText}>Mandatory</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={events}
      renderItem={renderEventItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
      ListEmptyComponent={
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>
              Check back later for scheduled events
            </Text>
          </Card.Content>
        </Card>
      }
    />
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
  listContent: {
    padding: Spacing.md,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  todayCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  todayChip: {
    backgroundColor: Colors.primary + '20',
    height: 24,
  },
  todayChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  eventDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  mandatoryText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
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
});
