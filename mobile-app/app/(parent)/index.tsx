import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';
import { Member, PaymentStatus } from '@/types';

export default function ParentHome() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Fetch parent's children
      const childrenResponse = await api.get('/members/my-children');
      setChildren(childrenResponse.data.data || []);

      // Fetch upcoming events count
      try {
        const eventsResponse = await api.get('/events/upcoming', { params: { limit: 7 } });
        setUpcomingEventsCount(eventsResponse.data.data?.length || 0);
      } catch {
        setUpcomingEventsCount(0);
      }
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setChildren([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const navigateToMember = (memberId: string) => {
    router.push(`/(parent)/member/${memberId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        <Text style={styles.userName}>{user?.fullName || 'Parent'}</Text>
      </View>

      {/* Quick Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="account-child" size={24} color={Colors.primary} />
            <Text style={styles.infoNumber}>{children.length}</Text>
            <Text style={styles.infoLabel}>Children</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar-today" size={24} color={Colors.info} />
            <Text style={styles.infoNumber}>{upcomingEventsCount}</Text>
            <Text style={styles.infoLabel}>Events This Week</Text>
          </View>
        </Card.Content>
      </Card>

      {/* My Children Section */}
      <Text style={styles.sectionTitle}>My Children</Text>

      {children.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="account-child-circle" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Children Added</Text>
            <Text style={styles.emptyText}>
              Your children will appear here once they are registered by your club's coach
            </Text>
          </Card.Content>
        </Card>
      ) : (
        children.map((child) => {
          const paymentInfo = getPaymentStatusInfo(child.paymentStatus);
          const medicalInfo = getMedicalStatusInfo(child.medicalCheckStatus);

          return (
            <TouchableOpacity
              key={child._id}
              onPress={() => navigateToMember(child._id)}
              activeOpacity={0.7}
            >
              <Card style={styles.childCard}>
                <Card.Content style={styles.childContent}>
                  <Avatar.Text
                    size={60}
                    label={child.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                    style={styles.childAvatar}
                  />
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.fullName}</Text>
                    <Text style={styles.childMeta}>Age: {child.age}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: paymentInfo.color + '20' }]}>
                        <MaterialCommunityIcons name={paymentInfo.icon} size={12} color={paymentInfo.color} />
                        <Text style={[styles.badgeText, { color: paymentInfo.color }]}>{paymentInfo.label}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: medicalInfo.color + '20' }]}>
                        <MaterialCommunityIcons name="medical-bag" size={12} color={medicalInfo.color} />
                        <Text style={[styles.badgeText, { color: medicalInfo.color }]}>{medicalInfo.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.qrButton}>
                    <MaterialCommunityIcons name="qrcode" size={32} color={Colors.primary} />
                    <Text style={styles.qrText}>QR</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })
      )}

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
  infoCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
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
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  childCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  childContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    backgroundColor: Colors.primary,
  },
  childInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  childName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  childMeta: {
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
  qrButton: {
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
  },
  qrText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
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
