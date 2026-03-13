import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Button, List, Divider, Switch, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import AccountSwitcher from '@/components/AccountSwitcher';
import LanguagePicker from '@/components/LanguagePicker';
import api from '@/services/api';

interface ClubInfo {
  _id: string;
  name: string;
  memberCount?: number;
}

export default function CoachProfile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isRegistered, registerForNotifications, unregisterFromNotifications, debugInfo } = usePushNotifications();

  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch club info
      if (user?.clubId) {
        try {
          const clubResponse = await api.get(`/clubs/${user.clubId}`);
          setClubInfo(clubResponse.data.data);
        } catch {
          // Club info might not be available
        }
      }

      // Fetch member count
      try {
        const membersResponse = await api.get('/members');
        setMemberCount(membersResponse.data.data?.length || 0);
      } catch {
        setMemberCount(0);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.clubId]);

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
      t('confirm.logoutTitle'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
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
    if (!name) return 'CO';
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
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          <View style={styles.headerRow}>
            {user?.profilePicture ? (
              <Avatar.Image size={56} source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={56} label={getInitials(user?.fullName)} style={styles.avatar} />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName || t('roles.coach')}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons name="whistle" size={14} color={Colors.primary} />
                <Text style={styles.roleText}>{t('roles.' + (user?.role?.toLowerCase() || 'coach'))}</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Club Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.clubInfo')}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="shield-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('profile.club')}</Text>
            <Text style={styles.infoValue}>{clubInfo?.name || t('profile.notAssigned')}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('dashboard.totalMembers')}</Text>
            <Text style={styles.infoValue}>{memberCount}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Contact Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.contactInfo')}</Text>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.contactValue} numberOfLines={1}>{user?.email || '--'}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.contactValue}>{user?.phoneNumber || '--'}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Switch Account - Prominent */}
      <Card style={styles.switchAccountCard}>
        <TouchableOpacity style={styles.switchAccountContent} onPress={() => setShowAccountSwitcher(true)}>
          <View style={styles.switchAccountIcon}>
            <MaterialCommunityIcons name="account-switch" size={24} color={Colors.primary} />
          </View>
          <View style={styles.switchAccountInfo}>
            <Text style={styles.switchAccountTitle}>{t('profile.switchAccount')}</Text>
            <Text style={styles.switchAccountDescription}>{t('profile.manageAccounts')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Settings Menu */}
      <Card style={styles.menuCard}>
        <List.Item
          title={t('profile.editProfile')}
          left={props => <List.Icon {...props} icon="account-edit" color={Colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={Colors.textSecondary} />}
          titleStyle={styles.menuItemTitle}
          onPress={() => router.push('/profile/edit')}
        />
        <Divider />
        <View style={styles.languageRow}>
          <MaterialCommunityIcons name="translate" size={24} color={Colors.text} style={styles.languageIcon} />
          <View style={styles.languagePickerWrapper}>
            <LanguagePicker />
          </View>
        </View>
        <Divider />
        <List.Item
          title={t('profile.pushNotifications')}
          description={notificationsEnabled ? t('status.active') : t('status.inactive')}
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
          title={t('profile.helpSupport')}
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
        {t('auth.logout')}
      </Button>

      {/* App Version */}
      <Text style={styles.versionText}>4Sports v1.0.0</Text>

      {/* Account Switcher Modal */}
      <AccountSwitcher
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        onAccountSwitch={(switchedUser) => {
          // Navigation is handled by AccountSwitcher based on user role
          console.log('Switched to user:', switchedUser.email, 'role:', switchedUser.role);
        }}
      />
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
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSize.lg,
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
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    gap: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  contactValue: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  divider: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  switchAccountCard: {
    backgroundColor: Colors.primary + '15',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  switchAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  switchAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchAccountInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  switchAccountTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  switchAccountDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  languageIcon: {
    marginLeft: Spacing.md,
  },
  languagePickerWrapper: {
    flex: 1,
    overflow: 'hidden',
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
