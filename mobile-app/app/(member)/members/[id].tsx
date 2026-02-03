import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';

interface MemberProfile {
  _id: string;
  fullName: string;
  profilePicture?: string;
  profileImage?: string;
  position?: string;
  jerseyNumber?: number;
  age?: number;
  userId?: string;
  groupId?: {
    _id: string;
    name: string;
  };
  groupName?: string;
}

export default function MemberProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMember = useCallback(async () => {
    if (!memberId) return;
    try {
      const response = await api.get(`/members/${memberId}`);
      setMember(response.data.data);
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      fetchMember();
    }, [fetchMember])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMember();
  };

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  const getGroupName = () => {
    if (member?.groupId && typeof member.groupId === 'object') {
      return member.groupId.name;
    }
    return member?.groupName || t('members.noGroup');
  };

  const getProfileImage = () => {
    return member?.profilePicture || member?.profileImage;
  };

  const handleStartChat = async () => {
    if (!member?.userId) {
      Alert.alert(
        t('common.error') || 'Greška',
        t('chat.memberNoAccount') || 'Ovaj član nema korisnički nalog i ne može primati poruke.'
      );
      return;
    }
    try {
      const response = await api.post('/chat/conversations', {
        participantIds: [member.userId],
      });
      const conversationId = response.data.data.conversationId || response.data.data._id;
      router.push(`/(member)/chat/${conversationId}` as any);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'INVALID_PARTICIPANTS') {
        Alert.alert(
          t('common.error') || 'Greška',
          t('chat.participantNotFound') || 'Nije moguće pokrenuti chat. Korisnik možda ne postoji ili nema pristup.'
        );
      } else {
        Alert.alert(
          t('common.error') || 'Greška',
          t('chat.startFailed') || 'Nije moguće pokrenuti chat. Pokušajte ponovo.'
        );
      }
    }
  };

  // Check if this is the current user's own profile
  const isOwnProfile = user && member?.userId === user._id;

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!member) {
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
            {getProfileImage() ? (
              <Image source={{ uri: getProfileImage() }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={100}
                label={getInitials(member.fullName)}
                style={styles.avatarPlaceholder}
              />
            )}
            <Text style={styles.memberName}>{member.fullName}</Text>
            <View style={styles.groupChip}>
              <MaterialCommunityIcons name="account-group" size={16} color={Colors.primary} />
              <Text style={styles.groupText}>{getGroupName()}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Basic Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('members.basicInfo') || 'Basic Info'}</Text>

            {member.jerseyNumber && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="tshirt-crew" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.jerseyNumber')}</Text>
                <Text style={styles.infoValue}>#{member.jerseyNumber}</Text>
              </View>
            )}

            {member.position && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="soccer" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.position')}</Text>
                <Text style={styles.infoValue}>{member.position}</Text>
              </View>
            )}

            {member.age && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cake-variant" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.age')}</Text>
                <Text style={styles.infoValue}>{member.age} {t('members.years')}</Text>
              </View>
            )}

            {!member.jerseyNumber && !member.position && !member.age && (
              <Text style={styles.noInfoText}>{t('members.noInfoAvailable') || 'No info available'}</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Fixed Chat Button - only show for other members */}
      {!isOwnProfile && member?.userId && (
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
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
  },
  memberName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  groupText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  noInfoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
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
