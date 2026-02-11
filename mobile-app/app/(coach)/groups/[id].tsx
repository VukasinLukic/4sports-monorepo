import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group, Member } from '@/types';

interface GroupMember {
  _id: string;
  fullName: string;
  profileImage?: string;
  dateOfBirth?: string;
  parentId?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export default function GroupDetailsScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchGroupData = useCallback(async () => {
    if (!id) return;

    try {
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/members`),
      ]);

      setGroup(groupRes.data.data);
      setMembers(membersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching group:', error);
      Alert.alert(t('common.error'), t('errors.loadingFailed'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchGroupData();
  };

  const handleEditGroup = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/(coach)/groups/form',
      params: { id: group?._id },
    });
  };

  const handleDeleteGroup = () => {
    setMenuVisible(false);
    Alert.alert(
      t('groups.deleteGroup'),
      t('groups.deleteGroupConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/groups/${id}`);
              router.back();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert(t('common.error'), t('errors.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      t('groups.removeFromGroup'),
      `${t('confirm.removeMessage') || 'Are you sure you want to remove'} ${member.fullName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('confirm.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/groups/${id}/members/${member._id}`);
              setMembers(members.filter((m) => m._id !== member._id));
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert(t('common.error'), t('errors.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleGenerateInviteCode = () => {
    router.push({
      pathname: '/(coach)/invites',
      params: { groupId: group?._id, groupName: group?.name },
    });
  };

  const getGroupColor = () => {
    return group?.color || Colors.primary;
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={Colors.error}
        />
        <Text style={styles.errorText}>{t('errors.notFound')}</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  iconColor={Colors.text}
                  onPress={() => setMenuVisible(true)}
                />
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={handleEditGroup}
                title={t('groups.editGroup')}
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={handleDeleteGroup}
                title={t('groups.deleteGroup')}
                leadingIcon="delete"
                titleStyle={{ color: Colors.error }}
              />
            </Menu>
          ),
        }}
      />

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
        {/* Group Info Card */}
        <Card style={styles.infoCard}>
          <View style={[styles.colorBar, { backgroundColor: getGroupColor() }]} />
          <Card.Content style={styles.infoContent}>
            <Text style={styles.groupName}>{group.name}</Text>

            <View style={styles.tagsContainer}>
              {group.ageGroup && (
                <Chip
                  mode="flat"
                  style={styles.tagChip}
                  textStyle={styles.tagChipText}
                >
                  {group.ageGroup}
                </Chip>
              )}
              {group.sport && (
                <Chip
                  mode="flat"
                  style={[styles.tagChip, styles.sportChip]}
                  textStyle={styles.tagChipText}
                >
                  {group.sport}
                </Chip>
              )}
            </View>

            {group.description && (
              <Text style={styles.description}>{group.description}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{members.length}</Text>
                <Text style={styles.statLabel}>{t('navigation.members')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{group.coachIds?.length || 0}</Text>
                <Text style={styles.statLabel}>{t('groups.coaches') || 'Coaches'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="account-plus"
            onPress={handleGenerateInviteCode}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            {t('invites.createInvite')}
          </Button>
          <Button
            mode="outlined"
            icon="pencil"
            onPress={handleEditGroup}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            {t('groups.editGroup')}
          </Button>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('navigation.members')} ({members.length})</Text>
          </View>

          {members.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={48}
                  color={Colors.textSecondary}
                />
                <Text style={styles.emptyText}>{t('empty.noMembers')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('invites.shareInviteDescription') || 'Generate an invite code and share it with parents'}
                </Text>
                <Button
                  mode="contained"
                  icon="qrcode"
                  onPress={handleGenerateInviteCode}
                  style={styles.inviteButton}
                >
                  {t('invites.generateCode')}
                </Button>
              </Card.Content>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member._id} style={styles.memberCard}>
                <Card.Content style={styles.memberContent}>
                  <View style={styles.memberRow}>
                    {member.profileImage ? (
                      <Avatar.Image
                        size={48}
                        source={{ uri: member.profileImage }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <Avatar.Text
                        size={48}
                        label={member.fullName.charAt(0).toUpperCase()}
                        style={[styles.memberAvatar, { backgroundColor: getGroupColor() }]}
                      />
                    )}

                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      {member.dateOfBirth && (
                        <Text style={styles.memberAge}>
                          {t('members.age')}: {calculateAge(member.dateOfBirth)} {t('members.years')}
                        </Text>
                      )}
                      {member.parentId && (
                        <Text style={styles.memberParent}>
                          {t('roles.parent')}: {member.parentId.fullName}
                        </Text>
                      )}
                    </View>

                    <IconButton
                      icon="dots-vertical"
                      iconColor={Colors.textSecondary}
                      onPress={() => handleRemoveMember(member)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </>
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
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.error,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  menuContent: {
    backgroundColor: Colors.surface,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  colorBar: {
    height: 6,
    width: '100%',
  },
  infoContent: {
    paddingTop: Spacing.md,
  },
  groupName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tagChip: {
    backgroundColor: Colors.primary + '20',
    height: 32,
    justifyContent: 'center',
  },
  sportChip: {
    backgroundColor: Colors.secondary + '20',
  },
  tagChipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: FontSize.sm + 2,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  statNumber: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonContent: {
    paddingVertical: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.lg,
  },
  inviteButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  memberContent: {
    paddingVertical: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberParent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
