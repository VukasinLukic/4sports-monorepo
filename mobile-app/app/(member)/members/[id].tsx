import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

interface MemberProfile {
  _id: string;
  fullName: string;
  profilePicture?: string;
  position?: string;
  jerseyNumber?: number;
  age?: number;
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
            {member.profilePicture ? (
              <Image source={{ uri: member.profilePicture }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={100}
                label={getInitials(member.fullName)}
                style={styles.avatarPlaceholder}
              />
            )}
            <Text style={styles.memberName}>{member.fullName}</Text>
            <Text style={styles.groupName}>{getGroupName()}</Text>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            {member.position && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="soccer" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.position')}</Text>
                <Text style={styles.infoValue}>{member.position}</Text>
              </View>
            )}

            {member.jerseyNumber && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="tshirt-crew" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.jerseyNumber')}</Text>
                <Text style={styles.infoValue}>#{member.jerseyNumber}</Text>
              </View>
            )}

            {member.age && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cake-variant" size={20} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{t('members.age')}</Text>
                <Text style={styles.infoValue}>{member.age} {t('members.years')}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingBottom: Spacing.xxl,
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
  groupName: {
    fontSize: FontSize.md,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.surface,
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
});
