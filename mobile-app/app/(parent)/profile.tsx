import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, Linking } from 'react-native';
import { Text, Card, Avatar, Button, List, Divider, Switch, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import api from '@/services/api';
import { Member, PaymentStatus } from '@/types';

interface ClubInfo {
  _id: string;
  name: string;
}

export default function ParentProfile() {
  const { user, logout } = useAuth();
  const { isRegistered, registerForNotifications, unregisterFromNotifications } = usePushNotifications();

  const [children, setChildren] = useState<Member[]>([]);
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);

  const fetchData = useCallback(async () => {
    try {
      // Fetch children
      const childrenResponse = await api.get('/members/my-children');
      const childrenData = childrenResponse.data.data || [];
      setChildren(childrenData);

      // Get club info from first child if available
      if (childrenData.length > 0 && childrenData[0].clubId) {
        try {
          const clubResponse = await api.get(`/clubs/${childrenData[0].clubId}`);
          setClubInfo(clubResponse.data.data);
        } catch {
          // Club info might not be available
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
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

  useEffect(() => {
    setNotificationsEnabled(isRegistered);
  }, [isRegistered]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await registerForNotifications();
    } else {
      await unregisterFromNotifications();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await unregisterFromNotifications();
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleOpenSupport = () => {
    Linking.openURL('mailto:support@4sports.app?subject=Support Request');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'PA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate children stats
  const paidCount = children.filter(c => c.paymentStatus === PaymentStatus.PAID).length;
  const medicalOkCount = children.filter(c => c.medicalCheckStatus === 'VALID').length;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={getInitials(user?.fullName)}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.fullName || 'Parent'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="account-child" size={16} color={Colors.secondary} />
            <Text style={styles.roleText}>Parent</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Children Summary */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>My Children</Text>
          <View style={styles.childSummary}>
            <View style={styles.childSummaryItem}>
              <Text style={styles.summaryNumber}>{children.length}</Text>
              <Text style={styles.summaryLabel}>Children</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.childSummaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.success }]}>{paidCount}</Text>
              <Text style={styles.summaryLabel}>Paid</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.childSummaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.success }]}>{medicalOkCount}</Text>
              <Text style={styles.summaryLabel}>Medical OK</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Contact Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user?.email || '--'}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phoneNumber || 'Not set'}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Club Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Club Information</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="shield-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Club</Text>
            <Text style={styles.infoValue}>{clubInfo?.name || 'Not assigned'}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Settings Menu */}
      <Card style={styles.menuCard}>
        <List.Item
          title="Edit Profile"
          left={props => <List.Icon {...props} icon="account-edit" color={Colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={Colors.textSecondary} />}
          titleStyle={styles.menuItemTitle}
          onPress={() => router.push('/profile/edit')}
        />
        <Divider />
        <List.Item
          title="Push Notifications"
          description={notificationsEnabled ? 'Enabled' : 'Disabled'}
          left={props => <List.Icon {...props} icon="bell-outline" color={Colors.text} />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              color={Colors.primary}
            />
          )}
          titleStyle={styles.menuItemTitle}
          descriptionStyle={[
            styles.menuItemDescription,
            { color: notificationsEnabled ? Colors.success : Colors.textSecondary }
          ]}
        />
        <Divider />
        <List.Item
          title="Help & Support"
          left={props => <List.Icon {...props} icon="help-circle-outline" color={Colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={Colors.textSecondary} />}
          titleStyle={styles.menuItemTitle}
          onPress={handleOpenSupport}
        />
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        icon="logout"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={Colors.error}
      >
        Logout
      </Button>

      {/* App Version */}
      <Text style={styles.versionText}>4Sports v1.0.0</Text>
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
  profileCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    backgroundColor: Colors.secondary,
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.secondary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  childSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  childSummaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    maxWidth: '40%',
  },
  divider: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  menuItemTitle: {
    color: Colors.text,
  },
  menuItemDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  logoutButton: {
    marginTop: Spacing.md,
    borderColor: Colors.error,
  },
  versionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
