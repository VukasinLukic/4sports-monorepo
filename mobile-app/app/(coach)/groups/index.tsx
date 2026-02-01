import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Searchbar,
  Button,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group, Member, InviteCode } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MemberWithAttendance extends Member {
  lastTrainingDate?: string;
}

interface GroupWithMembers extends Group {
  members?: MemberWithAttendance[];
  inviteCode?: InviteCode | null;
}

export default function GroupsScreen() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      const groupsData = response.data.data || [];
      setGroups(groupsData);
      setFilteredGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Filter members within groups by search query
  const displayGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredGroups;
    }

    const query = searchQuery.toLowerCase();
    return filteredGroups.map(group => ({
      ...group,
      members: group.members?.filter(m =>
        m.fullName.toLowerCase().includes(query)
      ),
    }));
  }, [filteredGroups, searchQuery]);

  useEffect(() => {
    setFilteredGroups(groups);
  }, [groups]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setExpandedGroupId(null);
    fetchGroups();
  };

  const fetchGroupMembers = async (groupId: string) => {
    setLoadingMembers(groupId);
    try {
      // Fetch members for this group
      const membersRes = await api.get(`/members?groupId=${groupId}`);
      const membersData: MemberWithAttendance[] = membersRes.data.data || [];

      // Fetch last attendance for each member
      const membersWithAttendance = await Promise.all(
        membersData.map(async (member) => {
          try {
            const attendanceRes = await api.get(`/attendance/member/${member._id}/last`);
            return {
              ...member,
              lastTrainingDate: attendanceRes.data.data?.eventDate || null,
            };
          } catch {
            return { ...member, lastTrainingDate: null };
          }
        })
      );

      // Check for valid invite code for this group
      let inviteCode: InviteCode | null = null;
      try {
        const invitesRes = await api.get('/invites');
        const allInvites = invitesRes.data.data || [];
        inviteCode = allInvites.find(
          (inv: InviteCode) =>
            inv.groupId &&
            (typeof inv.groupId === 'string' ? inv.groupId : inv.groupId._id) === groupId &&
            inv.isActive &&
            inv.isValid
        ) || null;
      } catch {
        // Ignore invite fetch errors
      }

      // Update the group with members
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, members: membersWithAttendance, inviteCode } : g
        )
      );
      setFilteredGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, members: membersWithAttendance, inviteCode } : g
        )
      );
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setLoadingMembers(null);
    }
  };

  const handleGroupPress = (group: GroupWithMembers) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (expandedGroupId === group._id) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(group._id);
      if (!group.members) {
        fetchGroupMembers(group._id);
      }
    }
  };

  const handleEditGroup = (group: Group) => {
    router.push({
      pathname: '/(coach)/groups/form',
      params: { id: group._id },
    });
  };

  const handleCreateGroup = () => {
    router.push('/(coach)/groups/form');
  };

  const handleAddMember = () => {
    router.push('/(coach)/invites');
  };

  const handleGenerateInvite = (groupId: string, groupName: string) => {
    router.push({
      pathname: '/(coach)/invites',
      params: { groupId, groupName },
    });
  };

  const handleCopyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t('invites.codeCopied') || 'Code copied', t('invites.codeCopiedMessage') || 'Invite code copied to clipboard');
  };

  const formatLastTraining = (dateString?: string | null): string => {
    if (!dateString) return t('attendance.noRecords') || 'No records';

    const date = new Date(dateString);
    const now = new Date();
    // Reset time to compare just dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('common.today') || 'Today';
    if (diffDays === 1) return t('common.yesterday') || 'Yesterday';
    if (diffDays === 2) return t('time.twoDaysAgo') || '2 days ago';
    if (diffDays < 7) return `${diffDays} ${t('time.daysAgo') || 'days ago'}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1
        ? (t('time.oneWeekAgo') || '1 week ago')
        : `${weeks} ${t('time.weeksAgo') || 'weeks ago'}`;
    }
    return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' });
  };

  const getGroupColor = (group: Group) => group.color || Colors.primary;

  const getMemberInitials = (member: Member) => {
    const name = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMemberPress = (memberId: string) => {
    router.push({
      pathname: '/(coach)/members/[id]',
      params: { id: memberId },
    });
  };

  const renderMemberCard = (member: MemberWithAttendance) => {
    const isPaid = member.paymentStatus === 'PAID';
    const avatar = member.profilePicture || member.profileImage;

    return (
      <TouchableOpacity
        key={member._id}
        style={styles.memberCard}
        onPress={() => handleMemberPress(member._id)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.memberAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.memberAvatarImage} />
          ) : (
            <Text style={styles.memberAvatarText}>{getMemberInitials(member)}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.fullName}</Text>
          <Text style={[styles.memberPayment, { color: isPaid ? Colors.success : Colors.error }]}>
            {isPaid ? (t('status.paid') || 'Paid') : (t('status.notPaid') || 'Not Paid')}
          </Text>
          <Text style={styles.memberLastTraining}>
            {t('groups.lastTraining') || 'Last Training'}: {formatLastTraining(member.lastTrainingDate)}
          </Text>
        </View>

        {/* Arrow */}
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderGroupCard = ({ item: group }: { item: GroupWithMembers }) => {
    const isExpanded = expandedGroupId === group._id;
    const isLoadingThisGroup = loadingMembers === group._id;

    return (
      <View style={styles.groupCardContainer}>
        {/* Group Header */}
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => handleGroupPress(group)}
          activeOpacity={0.7}
        >
          {/* Color Bar */}
          <View style={[styles.colorBar, { backgroundColor: getGroupColor(group) }]} />

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
          </View>

          {/* Right Side */}
          <View style={styles.groupRight}>
            <Text style={styles.memberCount}>
              {group.memberCount || 0} {t('navigation.members')?.toLowerCase() || 'members'}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleEditGroup(group);
              }}
              style={styles.editButton}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Members List */}
        {isExpanded && (
          <View style={styles.membersContainer}>
            {isLoadingThisGroup ? (
              <View style={styles.loadingMembers}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : group.members && group.members.length > 0 ? (
              <>
                {group.members.map(renderMemberCard)}

                {/* Invite Code Section */}
                <View style={styles.inviteSection}>
                  {group.inviteCode ? (
                    <View style={styles.inviteCodeBox}>
                      <View style={styles.inviteCodeLeft}>
                        <Text style={styles.inviteLabel}>{t('invites.inviteCode')}:</Text>
                        <Text style={styles.inviteCode}>{group.inviteCode.code}</Text>
                      </View>
                      <IconButton
                        icon="content-copy"
                        size={20}
                        iconColor={Colors.primary}
                        onPress={() => handleCopyInviteCode(group.inviteCode!.code)}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => handleGenerateInvite(group._id, group.name)}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
                      <Text style={styles.generateButtonText}>{t('invites.generateCode')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.noMembers}>
                <MaterialCommunityIcons name="account-off" size={32} color={Colors.textSecondary} />
                <Text style={styles.noMembersText}>{t('evidence.noMembersInGroup') || 'No members in this group'}</Text>
                {group.inviteCode ? (
                  <View style={styles.inviteCodeBox}>
                    <View style={styles.inviteCodeLeft}>
                      <Text style={styles.inviteLabel}>{t('invites.inviteCode')}:</Text>
                      <Text style={styles.inviteCode}>{group.inviteCode.code}</Text>
                    </View>
                    <IconButton
                      icon="content-copy"
                      size={20}
                      iconColor={Colors.primary}
                      onPress={() => handleCopyInviteCode(group.inviteCode!.code)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => handleGenerateInvite(group._id, group.name)}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
                    <Text style={styles.generateButtonText}>{t('invites.generateCode')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
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
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder={t('groups.searchMembers') || 'Search members...'}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={Colors.textSecondary}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Groups List */}
      {displayGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery ? t('empty.noResults') : t('empty.noGroups')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? t('empty.noResultsDescription')
              : t('empty.noGroupsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <Button
          mode="contained"
          icon="plus"
          onPress={handleCreateGroup}
          style={styles.bottomButton}
          buttonColor={Colors.primary}
        >
          {t('groups.newGroup') || 'New Group'}
        </Button>
        <Button
          mode="outlined"
          icon="account-plus"
          onPress={handleAddMember}
          style={styles.bottomButton}
          textColor={Colors.primary}
        >
          {t('groups.addMember') || 'Add Member'}
        </Button>
      </View>
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
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  searchBar: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 0,
  },
  searchInput: {
    color: Colors.text,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: 120,
  },
  groupCardContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
  },
  colorBar: {
    width: 6,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  groupInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  groupName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  groupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  editButton: {
    padding: Spacing.xs,
  },
  membersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loadingMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  memberName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  memberPayment: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  memberLastTraining: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noMembers: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noMembersText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inviteSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary + '15',
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  inviteCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inviteLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  inviteCode: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    borderStyle: 'dashed',
  },
  generateButtonText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  bottomButton: {
    flex: 1,
  },
});
