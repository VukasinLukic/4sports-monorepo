import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { useCoachDashboard } from '@/hooks/useDashboard';

export default function CoachDashboard() {
  const { user } = useAuth();
  const { data: dashboardStats, isLoading } = useCoachDashboard();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'TRAINING':
        return 'whistle';
      case 'MATCH':
        return 'soccer';
      default:
        return 'calendar';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || 'Coach'}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/(coach)/members')}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="account-group" size={32} color={Colors.primary} />
              <Text style={styles.statNumber}>{isLoading ? '...' : dashboardStats?.totalMembers ?? 0}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/(coach)/calendar')}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="calendar-check" size={32} color={Colors.info} />
              <Text style={styles.statNumber}>{isLoading ? '...' : dashboardStats?.eventsToday ?? 0}</Text>
              <Text style={styles.statLabel}>Events Today</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/(coach)/evidence')}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="cash" size={32} color={Colors.warning} />
              <Text style={styles.statNumber}>{isLoading ? '...' : dashboardStats?.unpaidCount ?? 0}</Text>
              <Text style={styles.statLabel}>Unpaid</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: '48%' }} onPress={() => router.push('/(coach)/evidence')}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="medical-bag" size={32} color={Colors.error} />
              <Text style={styles.statNumber}>{isLoading ? '...' : dashboardStats?.medicalDueCount ?? 0}</Text>
              <Text style={styles.statLabel}>Medical Due</Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <Button
          mode="contained"
          icon="clipboard-check"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          onPress={() => router.push('/(coach)/evidence')}
        >
          Evidence
        </Button>

        <Button
          mode="contained"
          icon="calendar-plus"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor={Colors.info}
          onPress={() => router.push('/(coach)/events/create')}
        >
          New Event
        </Button>

        <Button
          mode="contained"
          icon="account-plus"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor={Colors.secondary}
          onPress={() => router.push('/(coach)/members')}
        >
          Add Member
        </Button>

        <Button
          mode="contained"
          icon="cash-plus"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor={Colors.success}
          onPress={() => router.push('/(coach)/payments/record')}
        >
          Payment
        </Button>

        <Button
          mode="contained"
          icon="account-group"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor={Colors.warning}
          onPress={() => router.push('/(coach)/groups')}
        >
          Groups
        </Button>

        <Button
          mode="contained"
          icon="qrcode-plus"
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor="#6C5CE7"
          onPress={() => router.push('/(coach)/invites')}
        >
          Invite Codes
        </Button>
      </View>

      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {isLoading ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </Card.Content>
        </Card>
      ) : dashboardStats?.upcomingEvents && dashboardStats.upcomingEvents.length > 0 ? (
        <View style={styles.eventsContainer}>
          {dashboardStats.upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event._id}
              onPress={() => router.push(`/(coach)/events/${event._id}`)}
            >
              <Card style={styles.eventCard}>
                <Card.Content>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTypeContainer}>
                      <MaterialCommunityIcons
                        name={getEventTypeIcon(event.type) as any}
                        size={20}
                        color={Colors.primary}
                      />
                      <Text style={styles.eventType}>{event.type}</Text>
                    </View>
                    <Text style={styles.eventDate}>{formatDate(event.startTime)}</Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetail}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.eventDetailText}>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </Text>
                    </View>
                    {event.location && (
                      <View style={styles.eventDetail}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                      </View>
                    )}
                    {event.groupName && (
                      <View style={styles.eventDetail}>
                        <MaterialCommunityIcons name="account-group-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.eventDetailText}>{event.groupName}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.participantStats}>
                    <View style={styles.participantStat}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                      <Text style={styles.participantStatText}>{event.confirmedCount} confirmed</Text>
                    </View>
                    <View style={styles.participantStat}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.warning} />
                      <Text style={styles.participantStatText}>{event.pendingCount} pending</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
          <Button
            mode="text"
            onPress={() => router.push('/(coach)/calendar')}
            style={styles.viewAllButton}
          >
            View All Events
          </Button>
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(coach)/events/create')}
              style={styles.createEventButton}
            >
              Create Event
            </Button>
          </Card.Content>
        </Card>
      )}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    width: '48%',
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionButtonContent: {
    paddingVertical: Spacing.sm,
  },
  actionButtonLabel: {
    fontSize: FontSize.sm,
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
  eventsContainer: {
    marginBottom: Spacing.md,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eventType: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  eventDetails: {
    marginTop: Spacing.xs,
    gap: Spacing.xs / 2,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  eventDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  participantStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  participantStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  participantStatText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  viewAllButton: {
    marginTop: Spacing.xs,
  },
  createEventButton: {
    marginTop: Spacing.md,
  },
});
