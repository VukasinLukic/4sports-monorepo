import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Event, Attendance, Member, EventType } from '@/types';

interface AttendanceWithMember extends Attendance {
  member?: Member;
}

type ViewMode = 'qr' | 'list';

export default function EventSessionScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<AttendanceWithMember[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('qr');

  const fetchData = useCallback(async () => {
    try {
      // Fetch event details
      const eventResponse = await api.get(`/events/${eventId}`);
      const eventData = eventResponse.data.data;
      setEvent(eventData);

      // Fetch members for the group
      const membersResponse = await api.get(`/members`, {
        params: { groupId: eventData.groupId }
      });
      const membersData = membersResponse.data.data || [];
      setAllMembers(membersData);

      // Fetch attendance for this event
      const attendanceResponse = await api.get(`/attendance/event/${eventId}`);
      const attendanceData = attendanceResponse.data.data || [];

      // Create member map for quick lookup
      const memberMap = new Map<string, Member>();
      membersData.forEach((m: Member) => memberMap.set(m._id, m));

      // Enrich attendance with member data
      const enrichedAttendance: AttendanceWithMember[] = attendanceData.map((a: Attendance) => ({
        ...a,
        member: memberMap.get(a.memberId),
      }));

      setAttendance(enrichedAttendance);
    } catch (error) {
      console.error('Error fetching event session:', error);
      Alert.alert('Error', 'Failed to load event data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when screen comes into focus (to see new check-ins)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Auto-refresh every 10 seconds to show new check-ins
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        fetchData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData, isLoading, isRefreshing]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
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

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const totalMembers = allMembers.length;
  const attendancePercentage = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  // Get members without attendance marked
  const unmarkedMembers = allMembers.filter(
    member => !attendance.some(a => a.memberId === member._id)
  );

  // Generate QR code value - contains event ID for scanning
  const qrCodeValue = JSON.stringify({
    type: 'EVENT_ATTENDANCE',
    eventId: eventId,
    clubId: event?.clubId,
  });

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
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
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
        {/* Event Info Card */}
        <Card style={styles.eventCard}>
          <Card.Content>
            <View style={styles.eventHeader}>
              <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type) + '20' }]}>
                <Text style={[styles.typeText, { color: getEventTypeColor(event.type) }]}>
                  {event.type}
                </Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventDetails}>
              <View style={styles.eventRow}>
                <MaterialCommunityIcons name="calendar" size={16} color={Colors.textSecondary} />
                <Text style={styles.eventDetailText}>
                  {new Date(event.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.eventDetailText}>
                  {event.startTime} - {event.endTime}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Attendance Stats */}
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>{unmarkedMembers.length}</Text>
              <Text style={styles.statLabel}>Waiting</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>{attendancePercentage}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </Card.Content>
        </Card>

        {/* View Toggle */}
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'qr', label: 'QR Code', icon: 'qrcode' },
            { value: 'list', label: 'Attendance List', icon: 'format-list-bulleted' },
          ]}
          style={styles.segmentedButtons}
        />

        {viewMode === 'qr' ? (
          /* QR Code Display */
          <Card style={styles.qrCard}>
            <Card.Content style={styles.qrContent}>
              <Text style={styles.qrTitle}>Scan to Check In</Text>
              <Text style={styles.qrSubtitle}>
                Members scan this QR code with their app to confirm attendance
              </Text>

              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrCodeValue}
                  size={220}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>

              <View style={styles.qrInstructions}>
                <MaterialCommunityIcons name="information-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.instructionText}>
                  Display this QR code to your members. They will scan it using their 4Sports app to mark attendance.
                </Text>
              </View>

              <Button
                mode="outlined"
                icon="account-plus"
                onPress={() => router.push({
                  pathname: '/(coach)/attendance/manual-add',
                  params: { eventId }
                })}
                style={styles.manualButton}
              >
                Add Attendance Manually
              </Button>
            </Card.Content>
          </Card>
        ) : (
          /* Attendance List */
          <>
            {/* Present Members */}
            {attendance.filter(a => a.status === 'PRESENT').length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>
                  Present ({attendance.filter(a => a.status === 'PRESENT').length})
                </Text>
                {attendance
                  .filter(a => a.status === 'PRESENT')
                  .map(a => (
                    <Card key={a._id} style={styles.memberCard}>
                      <Card.Content style={styles.memberContent}>
                        {a.member?.profilePicture || a.member?.profileImage ? (
                          <Image
                            source={{ uri: (a.member.profilePicture || a.member.profileImage)! }}
                            style={[styles.memberAvatarImage, styles.memberAvatar]}
                          />
                        ) : (
                          <Avatar.Text
                            size={40}
                            label={a.member?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                            style={[styles.memberAvatar, { backgroundColor: Colors.success }]}
                          />
                        )}
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{a.member?.fullName || 'Unknown'}</Text>
                          <Text style={styles.memberMeta}>
                            Checked in at {new Date(a.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                      </Card.Content>
                    </Card>
                  ))}
              </>
            )}

            {/* Waiting Members */}
            {unmarkedMembers.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>
                  Waiting ({unmarkedMembers.length})
                </Text>
                {unmarkedMembers.map(member => (
                  <Card key={member._id} style={styles.memberCard}>
                    <Card.Content style={styles.memberContent}>
                      {member.profilePicture || member.profileImage ? (
                        <Image
                          source={{ uri: (member.profilePicture || member.profileImage)! }}
                          style={[styles.memberAvatarImage, styles.memberAvatar]}
                        />
                      ) : (
                        <Avatar.Text
                          size={40}
                          label={member.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                          style={[styles.memberAvatar, { backgroundColor: Colors.textSecondary }]}
                        />
                      )}
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.fullName}</Text>
                        <Text style={styles.memberMeta}>Not checked in yet</Text>
                      </View>
                      <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.textSecondary} />
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}

            {/* Empty State */}
            {totalMembers === 0 && (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No members in this group</Text>
                </Card.Content>
              </Card>
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
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  eventDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eventDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  segmentedButtons: {
    marginBottom: Spacing.md,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  qrContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  qrTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  qrSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  qrInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  instructionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  manualButton: {
    marginTop: Spacing.sm,
  },
  subSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    marginRight: Spacing.md,
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
});
