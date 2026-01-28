import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Chip, Button, SegmentedButtons, Avatar, IconButton, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Event, EventType, EventParticipant, EventParticipantsStats } from '@/types';

type TabType = 'overview' | 'participants';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [stats, setStats] = useState<EventParticipantsStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details');
    }
  }, [id]);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}/participants`);
      setParticipants(response.data.data.participants || []);
      setStats(response.data.data.stats || null);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchEvent(), fetchParticipants()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchEvent, fetchParticipants]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      fetchParticipants();
    }, [fetchParticipants])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getGroupName = () => {
    if (!event?.groupId) return 'Unknown';
    if (typeof event.groupId === 'string') return 'Group';
    return event.groupId.name;
  };

  const handleShowQRCode = () => {
    router.push({
      pathname: '/(coach)/events/qr',
      params: { eventId: id, eventTitle: event?.title, qrCode: event?.qrCode },
    });
  };

  const handleEditEvent = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/(coach)/events/edit',
      params: { id },
    });
  };

  const handleCancelEvent = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/events/${id}`, { status: 'CANCELLED' });
              Alert.alert('Success', 'Event cancelled');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel event');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/events/${id}`);
              Alert.alert('Success', 'Event deleted');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleMarkAttendance = async (participantId: string, memberId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    try {
      await api.post('/attendance/mark', {
        eventId: id,
        memberId,
        status,
      });
      // Refresh participants
      fetchParticipants();
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return Colors.success;
      case 'LATE':
        return Colors.warning;
      case 'ABSENT':
        return Colors.error;
      case 'EXCUSED':
        return Colors.info || Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const getRsvpColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'CONFIRMED':
        return Colors.success;
      case 'DECLINED':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="calendar-remove" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorText}>Event not found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    );
  }

  const startFormatted = formatDateTime(event.startTime);
  const endFormatted = formatDateTime(event.endTime);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type as EventType) }]}>
            <Text style={styles.typeBadgeText}>{event.type}</Text>
          </View>
          {event.status === 'CANCELLED' && (
            <Chip style={styles.cancelledChip} textStyle={styles.cancelledChipText}>
              Cancelled
            </Chip>
          )}
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              iconColor={Colors.text}
            />
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item onPress={handleShowQRCode} title="Show QR Code" leadingIcon="qrcode" />
          <Menu.Item onPress={handleEditEvent} title="Edit Event" leadingIcon="pencil" />
          <Menu.Item onPress={handleCancelEvent} title="Cancel Event" leadingIcon="close-circle" />
          <Menu.Item onPress={handleDeleteEvent} title="Delete Event" leadingIcon="delete" titleStyle={{ color: Colors.error }} />
        </Menu>
      </View>

      {/* Title */}
      <Text style={styles.title}>{event.title}</Text>

      {/* Tabs */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        buttons={[
          { value: 'overview', label: 'Overview' },
          { value: 'participants', label: `Participants (${stats?.total || 0})` },
        ]}
        style={styles.tabs}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {activeTab === 'overview' ? (
          <>
            {/* Date & Time */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Date</Text>
                    <Text style={styles.infoValue}>{startFormatted.date}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.infoValue}>{startFormatted.time} - {endFormatted.time}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Location */}
            {event.location && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={24} color={Colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Location</Text>
                      <Text style={styles.infoValue}>{event.location}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Group */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Group</Text>
                    <Text style={styles.infoValue}>{getGroupName()}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Description */}
            {event.description && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{event.description}</Text>
                </Card.Content>
              </Card>
            )}

            {/* Notes */}
            {event.notes && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.description}>{event.notes}</Text>
                </Card.Content>
              </Card>
            )}

            {/* Equipment */}
            {event.equipment && event.equipment.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Required Equipment</Text>
                  <View style={styles.equipmentList}>
                    {event.equipment.map((item, index) => (
                      <Chip key={index} style={styles.equipmentChip} textStyle={styles.equipmentChipText}>
                        {item}
                      </Chip>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Quick Stats */}
            {stats && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Attendance Summary</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.confirmed}</Text>
                      <Text style={styles.statLabel}>Confirmed</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.error }]}>{stats.declined}</Text>
                      <Text style={styles.statLabel}>Declined</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.pending}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.present}</Text>
                      <Text style={styles.statLabel}>Present</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* QR Code Button */}
            <Button
              mode="contained"
              onPress={handleShowQRCode}
              icon="qrcode"
              style={styles.qrButton}
            >
              Show QR Code for Check-in
            </Button>
          </>
        ) : (
          <>
            {/* Participants Stats */}
            {stats && (
              <View style={styles.participantStats}>
                <View style={[styles.participantStatChip, { backgroundColor: Colors.success + '20' }]}>
                  <Text style={[styles.participantStatText, { color: Colors.success }]}>
                    {stats.present} Present
                  </Text>
                </View>
                <View style={[styles.participantStatChip, { backgroundColor: Colors.warning + '20' }]}>
                  <Text style={[styles.participantStatText, { color: Colors.warning }]}>
                    {stats.confirmed} Confirmed
                  </Text>
                </View>
                <View style={[styles.participantStatChip, { backgroundColor: Colors.error + '20' }]}>
                  <Text style={[styles.participantStatText, { color: Colors.error }]}>
                    {stats.absent} Absent
                  </Text>
                </View>
              </View>
            )}

            {/* Participants List */}
            {participants.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No participants yet</Text>
                </Card.Content>
              </Card>
            ) : (
              participants.map((participant) => (
                <Card key={participant._id} style={styles.participantCard}>
                  <Card.Content style={styles.participantContent}>
                    <Avatar.Text
                      size={44}
                      label={participant.memberId.fullName?.slice(0, 2).toUpperCase() || '??'}
                      style={styles.participantAvatar}
                    />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.memberId.fullName}</Text>
                      <View style={styles.participantBadges}>
                        <Chip
                          compact
                          style={[styles.statusChip, { backgroundColor: getRsvpColor(participant.rsvpStatus) + '20' }]}
                          textStyle={[styles.statusChipText, { color: getRsvpColor(participant.rsvpStatus) }]}
                        >
                          {participant.rsvpStatus}
                        </Chip>
                        <Chip
                          compact
                          style={[styles.statusChip, { backgroundColor: getStatusColor(participant.status) + '20' }]}
                          textStyle={[styles.statusChipText, { color: getStatusColor(participant.status) }]}
                        >
                          {participant.status}
                        </Chip>
                      </View>
                    </View>
                    <View style={styles.participantActions}>
                      <IconButton
                        icon="check"
                        size={20}
                        iconColor={participant.status === 'PRESENT' ? Colors.success : Colors.textSecondary}
                        onPress={() => handleMarkAttendance(participant._id, participant.memberId._id, 'PRESENT')}
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor={participant.status === 'ABSENT' ? Colors.error : Colors.textSecondary}
                        onPress={() => handleMarkAttendance(participant._id, participant.memberId._id, 'ABSENT')}
                      />
                    </View>
                  </Card.Content>
                </Card>
              ))
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  backButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelledChip: {
    backgroundColor: Colors.error + '20',
  },
  cancelledChipText: {
    color: Colors.error,
    fontSize: FontSize.xs,
  },
  menuContent: {
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  tabs: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  equipmentChip: {
    backgroundColor: Colors.primary + '20',
    height: 28,
  },
  equipmentChipText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qrButton: {
    backgroundColor: Colors.primary,
    marginTop: Spacing.md,
  },
  participantStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  participantStatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  participantStatText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
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
  participantCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    backgroundColor: Colors.primary,
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  participantBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs + 2,
  },
  participantActions: {
    flexDirection: 'row',
  },
});
