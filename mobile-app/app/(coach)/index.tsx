import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';

export default function CoachDashboard() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || 'Coach'}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="account-group" size={32} color={Colors.primary} />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Members</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="calendar-check" size={32} color={Colors.info} />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Events Today</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="cash" size={32} color={Colors.warning} />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Unpaid</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="medical-bag" size={32} color={Colors.error} />
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Medical Due</Text>
          </Card.Content>
        </Card>
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

      {/* Today's Events */}
      <Text style={styles.sectionTitle}>Today's Events</Text>
      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No events scheduled for today</Text>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <MaterialCommunityIcons name="history" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No recent activity</Text>
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
});
