import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';
import { PaymentStatus, Member, Event, EventType } from '@/types';

export default function MemberHome() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch member's own profile
      const memberResponse = await api.get('/members/me');
      setMember(memberResponse.data.data);

      // Fetch upcoming events
      try {
        const eventsResponse = await api.get('/events/upcoming', { params: { limit: 5 } });
        setUpcomingEvents(eventsResponse.data.data || []);
      } catch {
        setUpcomingEvents([]);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMember(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const getPaymentStatusInfo = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return { color: Colors.success, label: 'Paid', icon: 'check-circle' as const };
      case PaymentStatus.UNPAID:
        return { color: Colors.error, label: 'Unpaid', icon: 'alert-circle' as const };
      case PaymentStatus.PARTIAL:
        return { color: Colors.warning, label: 'Partial', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const getMedicalStatusInfo = (status: string) => {
    switch (status) {
      case 'VALID':
        return { color: Colors.success, label: 'Medical OK', icon: 'check-circle' as const };
      case 'EXPIRED':
        return { color: Colors.error, label: 'Expired', icon: 'alert-circle' as const };
      case 'EXPIRING_SOON':
        return { color: Colors.warning, label: 'Expiring', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const paymentInfo = member ? getPaymentStatusInfo(member.paymentStatus) : null;
  const medicalInfo = member ? getMedicalStatusInfo(member.medicalCheckStatus) : null;

  // Get group name from member
  const getGroupName = () => {
    if (!member?.clubs || member.clubs.length === 0) return 'Not assigned';
    const activeClub = member.clubs.find(c => c.status === 'ACTIVE');
    if (!activeClub) return 'Not assigned';
    const groupId = activeClub.groupId;
    if (typeof groupId === 'object' && groupId?.name) {
      return groupId.name;
    }
    return 'Unknown';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || member?.fullName || 'Member'}</Text>
      </View>

      {/* Profile Card */}
      {member && (
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={70}
              label={getInitials(member.fullName)}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.memberName}>{member.fullName}</Text>
              <Text style={styles.memberGroup}>{getGroupName()}</Text>
              {member.age && <Text style={styles.memberAge}>Age: {member.age}</Text>}
              <View style={styles.badgeRow}>
                {paymentInfo && (
                  <View style={[styles.badge, { backgroundColor: paymentInfo.color + '20' }]}>
                    <MaterialCommunityIcons name={paymentInfo.icon} size={12} color={paymentInfo.color} />
                    <Text style={[styles.badgeText, { color: paymentInfo.color }]}>{paymentInfo.label}</Text>
                  </View>
                )}
                {medicalInfo && (
                  <View style={[styles.badge, { backgroundColor: medicalInfo.color + '20' }]}>
                    <MaterialCommunityIcons name="medical-bag" size={12} color={medicalInfo.color} />
                    <Text style={[styles.badgeText, { color: medicalInfo.color }]}>{medicalInfo.label}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar-today" size={24} color={Colors.info} />
            <Text style={styles.infoNumber}>{upcomingEvents.length}</Text>
            <Text style={styles.infoLabel}>Upcoming Events</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(member)/payments')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '20' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color={Colors.success} />
          </View>
          <Text style={styles.quickActionText}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(member)/attendance')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '20' }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={Colors.info} />
          </View>
          <Text style={styles.quickActionText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(member)/scan')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Check In</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events Preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity onPress={() => router.push('/(member)/calendar')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {upcomingEvents.length === 0 ? (
        <Card style={styles.eventPreviewCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="calendar-blank" size={32} color={Colors.textSecondary} />
            <Text style={styles.noEventsText}>No upcoming events</Text>
          </Card.Content>
        </Card>
      ) : (
        upcomingEvents.slice(0, 3).map((event) => {
          const eventDate = new Date(event.startTime);
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const eventTypeColor = event.type === EventType.TRAINING ? Colors.primary :
                                event.type === EventType.MATCH ? Colors.success : Colors.info;

          return (
            <TouchableOpacity
              key={event._id}
              onPress={() => router.push({ pathname: '/(member)/events/[id]', params: { id: event._id } })}
              activeOpacity={0.7}
            >
              <Card style={[styles.eventCard, isToday && styles.todayEventCard]}>
                <Card.Content style={styles.eventCardContent}>
                  <View style={styles.eventDateBox}>
                    <Text style={styles.eventDay}>{eventDate.getDate()}</Text>
                    <Text style={styles.eventMonth}>
                      {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                      {isToday && (
                        <Chip style={styles.todayChip} textStyle={styles.todayChipText}>Today</Chip>
                      )}
                    </View>
                    <View style={styles.eventMeta}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.eventMetaText}>
                        {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={[styles.eventTypeDot, { backgroundColor: eventTypeColor }]} />
                      <Text style={[styles.eventTypeText, { color: eventTypeColor }]}>{event.type}</Text>
                    </View>
                    {event.location && (
                      <View style={styles.eventMeta}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.eventMetaText} numberOfLines={1}>{event.location}</Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })
      )}

      {/* Notifications Preview */}
      <Text style={styles.sectionTitle}>Recent Notifications</Text>
      <Card style={styles.notificationCard}>
        <Card.Content style={styles.notificationContent}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.noNotificationsText}>No new notifications</Text>
        </Card.Content>
      </Card>
    </ScrollView>
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
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  memberGroup: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventPreviewCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noEventsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  todayEventCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventDateBox: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
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
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  todayChip: {
    backgroundColor: Colors.primary + '20',
    height: 22,
  },
  todayChipText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  eventMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: Spacing.sm,
  },
  eventTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  noNotificationsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
