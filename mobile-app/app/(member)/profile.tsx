import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl, Linking } from 'react-native';
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
import { Member } from '@/types';

interface ClubInfo {
  _id: string;
  name: string;
}

export default function MemberProfile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isRegistered, registerForNotifications, unregisterFromNotifications } = usePushNotifications();

  const [member, setMember] = useState<Member | null>(null);
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch member profile
      const memberResponse = await api.get('/members/me');
      const memberData = memberResponse.data.data;
      setMember(memberData);

      // Get club info from member
      if (memberData?.clubs && memberData.clubs.length > 0) {
        const activeClub = memberData.clubs.find((c: any) => c.status === 'ACTIVE');
        if (activeClub?.clubId) {
          // Handle both populated object and string ID
          let clubId: string | null = null;
          if (typeof activeClub.clubId === 'string') {
            clubId = activeClub.clubId;
          } else if (activeClub.clubId?._id) {
            clubId = activeClub.clubId._id;
          } else if (activeClub.clubId?.id) {
            clubId = activeClub.clubId.id;
          }

          if (clubId) {
            try {
              const clubResponse = await api.get(`/clubs/${clubId}`);
              setClubInfo(clubResponse.data.data);
            } catch {
              // Club info might not be available
            }
          }
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
    if (!name) return 'ME';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get group name from member
  const getGroupName = () => {
    if (!member?.clubs || member.clubs.length === 0) return t('profile.notAssigned');
    const activeClub = member.clubs.find(c => c.status === 'ACTIVE');
    if (!activeClub) return t('profile.notAssigned');
    const groupId = activeClub.groupId;
    if (typeof groupId === 'object' && groupId?.name) {
      return groupId.name;
    }
    return t('profile.notAssigned');
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
          <Avatar.Text
            size={80}
            label={getInitials(member?.fullName || user?.fullName)}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{member?.fullName || user?.fullName || 'Member'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="account" size={16} color={Colors.primary} />
            <Text style={styles.roleText}>{t('roles.member')}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Member Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('members.memberDetails')}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('members.group')}</Text>
            <Text style={styles.infoValue}>{getGroupName()}</Text>
          </View>
          {member?.age && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cake-variant" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.age')}</Text>
                <Text style={styles.infoValue}>{member.age}</Text>
              </View>
            </>
          )}
          {member?.gender && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="human-male-female" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.gender')}</Text>
                <Text style={styles.infoValue}>{member.gender}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Contact Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{t('profile.contactInfo')}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('auth.email')}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{user?.email || '--'}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>{t('auth.phoneNumber')}</Text>
            <Text style={styles.infoValue}>{user?.phoneNumber || t('profile.notAssigned')}</Text>
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
        </Card.Content>
      </Card>

      {/* Body Metrics */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="human-male-height" size={28} color={Colors.primary} />
              <Text style={styles.metricValue}>
                {member?.bodyMetrics?.height || member?.height || '--'}
              </Text>
              <Text style={styles.metricLabel}>Height (cm)</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <MaterialCommunityIcons name="weight-kilogram" size={28} color={Colors.primary} />
              <Text style={styles.metricValue}>
                {member?.bodyMetrics?.weight || member?.weight || '--'}
              </Text>
              <Text style={styles.metricLabel}>Weight (kg)</Text>
            </View>
          </View>
          {(member?.bodyMetrics?.height && member?.bodyMetrics?.weight) && (
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiLabel}>BMI</Text>
              <Text style={styles.bmiValue}>
                {(member.bodyMetrics.weight / Math.pow(member.bodyMetrics.height / 100, 2)).toFixed(1)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Medical Info */}
      {member?.medicalInfo && (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            {member.medicalInfo.bloodType && (
              <>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="water" size={20} color={Colors.error} />
                  <Text style={styles.infoLabel}>Blood Type</Text>
                  <Text style={styles.infoValue}>{member.medicalInfo.bloodType}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            {member.medicalInfo.allergies && (
              <>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.warning} />
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{member.medicalInfo.allergies}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            {member.medicalInfo.conditions && (
              <>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="medical-bag" size={20} color={Colors.info} />
                  <Text style={styles.infoLabel}>Conditions</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{member.medicalInfo.conditions}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            {member.medicalInfo.expiryDate && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>Valid Until</Text>
                <Text style={styles.infoValue}>
                  {new Date(member.medicalInfo.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {!member.medicalInfo.bloodType && !member.medicalInfo.allergies && !member.medicalInfo.conditions && !member.medicalInfo.expiryDate && (
              <Text style={styles.noDataText}>No medical information on file</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Emergency Contact */}
      {member?.emergencyContact && (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-alert" size={20} color={Colors.error} />
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{member.emergencyContact.name}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Relationship</Text>
              <Text style={styles.infoValue}>{member.emergencyContact.relationship}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color={Colors.success} />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{member.emergencyContact.phoneNumber}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

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
        <List.Item
          title={t('profile.switchAccount')}
          description={t('profile.manageAccounts')}
          left={props => <List.Icon {...props} icon="account-switch" color={Colors.text} />}
          right={props => <List.Icon {...props} icon="chevron-right" color={Colors.textSecondary} />}
          titleStyle={styles.menuItemTitle}
          descriptionStyle={styles.menuItemDescription}
          onPress={() => setShowAccountSwitcher(true)}
        />
        <Divider />
        <View style={styles.languagePickerContainer}>
          <List.Icon icon="translate" color={Colors.text} />
          <LanguagePicker />
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
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSize.sm,
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
  languagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    flex: 1,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  metricLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
  },
  bmiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  bmiLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  bmiValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  noDataText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontStyle: 'italic',
  },
});
