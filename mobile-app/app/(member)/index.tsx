import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';
import { PaymentStatus, Member } from '@/types';

export default function MemberHome() {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Fetch member's own profile
      const memberResponse = await api.get('/members/me');
      setMember(memberResponse.data.data);

      // Fetch upcoming events count
      try {
        const eventsResponse = await api.get('/events/upcoming', { params: { limit: 7 } });
        setUpcomingEventsCount(eventsResponse.data.data?.length || 0);
      } catch {
        setUpcomingEventsCount(0);
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
            <Text style={styles.infoNumber}>{upcomingEventsCount}</Text>
            <Text style={styles.infoLabel}>Events This Week</Text>
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
          onPress={() => router.push('/(member)/events')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
            <MaterialCommunityIcons name="calendar" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Events</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events Preview */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <Card style={styles.eventPreviewCard}>
        <Card.Content>
          <View style={styles.eventPreviewHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.info} />
            <Text style={styles.eventPreviewTitle}>Next Training</Text>
          </View>
          <Text style={styles.noEventsText}>
            {upcomingEventsCount > 0
              ? `${upcomingEventsCount} event(s) scheduled`
              : 'No upcoming events'}
          </Text>
        </Card.Content>
      </Card>

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
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  eventPreviewCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  eventPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventPreviewTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  noEventsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
