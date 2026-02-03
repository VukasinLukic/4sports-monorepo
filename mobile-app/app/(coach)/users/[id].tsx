import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

interface UserGroup {
  _id: string;
  name: string;
  ageGroup?: string;
}

interface UserProfile {
  _id: string;
  fullName: string;
  profilePicture?: string;
  role: string;
  phoneNumber?: string;
  groups?: UserGroup[];
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await api.get(`/auth/users/${userId}`);
      setUser(response.data.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchUser();
  };

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return t('roles.owner') || 'Owner';
      case 'COACH': return t('roles.coach') || 'Coach';
      case 'MEMBER': return t('roles.member') || 'Member';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return 'shield-crown';
      case 'COACH': return 'whistle';
      case 'MEMBER': return 'account';
      default: return 'account';
    }
  };

  const handleStartChat = async () => {
    if (!userId) return;

    try {
      const response = await api.post('/chat/conversations', {
        participantIds: [userId],
      });
      const conversationId = response.data.data.conversationId || response.data.data._id;
      router.push(`/(coach)/chat/${conversationId}` as any);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleCallPhone = () => {
    if (user?.phoneNumber) {
      Linking.openURL(`tel:${user.phoneNumber}`);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="account-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>{t('errors.notFound')}</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('navigation.profile')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            {user.profilePicture ? (
              <Avatar.Image size={100} source={{ uri: user.profilePicture }} />
            ) : (
              <Avatar.Text
                size={100}
                label={getInitials(user.fullName)}
                style={styles.avatarPlaceholder}
              />
            )}
            <Text style={styles.userName}>{user.fullName}</Text>
            <View style={styles.roleChip}>
              <MaterialCommunityIcons
                name={getRoleIcon(user.role)}
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
            </View>

            {/* Phone number if available */}
            {user.phoneNumber && (
              <TouchableOpacity style={styles.phoneRow} onPress={handleCallPhone}>
                <MaterialCommunityIcons name="phone" size={16} color={Colors.textSecondary} />
                <Text style={styles.phoneText}>{user.phoneNumber}</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Groups Card - for coaches/owners */}
        {user.groups && user.groups.length > 0 && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t('groups.trainsGroups') || 'Trains Groups'}</Text>
              {user.groups.map((group) => (
                <View key={group._id} style={styles.groupRow}>
                  <MaterialCommunityIcons name="account-group" size={20} color={Colors.textSecondary} />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.ageGroup && (
                      <Text style={styles.groupAge}>{group.ageGroup}</Text>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Fixed Chat Button */}
      {userId && user && (
        <TouchableOpacity style={styles.chatFab} onPress={handleStartChat}>
          <MaterialCommunityIcons name="message-text" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  roleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  phoneText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  groupAge: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chatFab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
