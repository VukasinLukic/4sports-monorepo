import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Avatar,
  Checkbox,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group, Member } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type EvidenceTab = 'membership' | 'medical';

interface GroupWithMembers extends Group {
  members: MemberWithStatus[];
  paidCount: number;
  totalCount: number;
}

interface MemberWithStatus extends Member {
  isPaid: boolean;
  isValidMedical: boolean;
  lastActive?: string;
}

export default function EvidenceScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<EvidenceTab>('membership');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [groupsWithMembers, setGroupsWithMembers] = useState<GroupWithMembers[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  // Overall stats
  const totalPaid = groupsWithMembers.reduce((sum, g) => sum + g.paidCount, 0);
  const totalMembers = groupsWithMembers.reduce((sum, g) => sum + g.totalCount, 0);
  const progressPercent = totalMembers > 0 ? (totalPaid / totalMembers) * 100 : 0;

  const fetchData = useCallback(async () => {
    try {
      // Fetch groups
      const groupsResponse = await api.get('/groups');
      const groups: Group[] = groupsResponse.data.data || [];

      // Fetch members for each group with payment/medical status
      const groupsWithData: GroupWithMembers[] = await Promise.all(
        groups.map(async (group) => {
          try {
            // Fetch members of the group
            const membersResponse = await api.get(`/members?groupId=${group._id}`);
            const members: Member[] = membersResponse.data.data || [];

            // Fetch evidence for this group
            const evidenceParams = activeTab === 'membership'
              ? { groupId: group._id, month: selectedMonth, year: selectedYear }
              : { groupId: group._id };

            const evidenceResponse = await api.get(
              `/evidence/${activeTab === 'membership' ? 'membership' : 'medical'}`,
              { params: evidenceParams }
            );
            const evidenceData = evidenceResponse.data.data.evidence || [];

            // Map members with their status
            const membersWithStatus: MemberWithStatus[] = members.map((member) => {
              const evidence = evidenceData.find((e: any) => e.memberId === member._id);
              return {
                ...member,
                isPaid: evidence?.status === 'PAID',
                isValidMedical: evidence?.status === 'VALID',
                lastActive: member.updatedAt,
              };
            });

            const paidCount = activeTab === 'membership'
              ? membersWithStatus.filter(m => m.isPaid).length
              : membersWithStatus.filter(m => m.isValidMedical).length;

            return {
              ...group,
              members: membersWithStatus,
              paidCount,
              totalCount: members.length,
            };
          } catch (error) {
            console.error(`Error fetching data for group ${group._id}:`, error);
            return {
              ...group,
              members: [],
              paidCount: 0,
              totalCount: 0,
            };
          }
        })
      );

      setGroupsWithMembers(groupsWithData);
    } catch (error) {
      console.error('Error fetching evidence data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const toggleGroupExpanded = (groupId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleMarkMember = async (member: MemberWithStatus) => {
    const actionKey = `mark-${member._id}`;
    if (loadingActions.has(actionKey)) return;

    setLoadingActions(prev => new Set(prev).add(actionKey));

    try {
      if (activeTab === 'membership') {
        await api.post(`/evidence/membership/${member._id}`, {
          month: selectedMonth,
          year: selectedYear,
          paymentMethod: 'CASH',
        });
      } else {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        await api.post(`/evidence/medical/${member._id}`, {
          lastCheckDate: new Date().toISOString(),
          expiryDate: expiryDate.toISOString(),
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error marking member:', error);
      Alert.alert(t('common.error'), t('evidence.failedToMarkPaid'));
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleRemindMember = async (member: MemberWithStatus) => {
    const actionKey = `remind-${member._id}`;
    if (loadingActions.has(actionKey)) return;

    setLoadingActions(prev => new Set(prev).add(actionKey));

    try {
      const endpoint = activeTab === 'membership'
        ? `/reminders/payment/member/${member._id}`
        : `/reminders/medical/member/${member._id}`;

      await api.post(endpoint);
      Alert.alert(
        t('common.success'),
        activeTab === 'membership'
          ? t('reminders.paymentSent')
          : t('reminders.medicalSent')
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
      Alert.alert(t('common.error'), t('reminders.failedToSend'));
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleRemindGroup = async (group: GroupWithMembers) => {
    const actionKey = `remind-group-${group._id}`;
    if (loadingActions.has(actionKey)) return;

    setLoadingActions(prev => new Set(prev).add(actionKey));

    try {
      const endpoint = activeTab === 'membership'
        ? `/reminders/payment/group/${group._id}`
        : `/reminders/medical/group/${group._id}`;

      const response = await api.post(endpoint);
      const count = response.data.data?.remindersCount || 0;

      Alert.alert(
        t('common.success'),
        `${t('reminders.sentTo')} ${count} ${t('reminders.members')}`
      );
    } catch (error) {
      console.error('Error sending group reminder:', error);
      Alert.alert(t('common.error'), t('reminders.failedToSend'));
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleRemindAll = async () => {
    Alert.alert(
      t('reminders.confirmTitle'),
      t('reminders.confirmAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            const actionKey = 'remind-all';
            setLoadingActions(prev => new Set(prev).add(actionKey));

            try {
              const endpoint = activeTab === 'membership'
                ? '/reminders/payment/all'
                : '/reminders/medical/all';

              const response = await api.post(endpoint);
              const count = response.data.data?.remindersCount || 0;

              Alert.alert(
                t('common.success'),
                `${t('reminders.sentTo')} ${count} ${t('reminders.members')}`
              );
            } catch (error) {
              console.error('Error sending all reminders:', error);
              Alert.alert(t('common.error'), t('reminders.failedToSend'));
            } finally {
              setLoadingActions(prev => {
                const newSet = new Set(prev);
                newSet.delete(actionKey);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const getMonthName = (month: number) => {
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    return t(`dateTime.months.${monthKeys[month - 1]}`);
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('time.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('time.daysAgo')}`;
    return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
  };

  // Filter members within groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupsWithMembers;
    }

    const query = searchQuery.toLowerCase();
    return groupsWithMembers
      .map(group => ({
        ...group,
        members: group.members.filter(m =>
          m.fullName.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.members.length > 0); // Only show groups that have matching members
  }, [groupsWithMembers, searchQuery]);

  const renderMonthFilter = () => {
    if (!showMonthFilter || activeTab !== 'membership') return null;

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <View style={styles.monthFilterContainer}>
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.monthsGrid}>
          {months.map(month => (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthButton,
                selectedMonth === month && styles.monthButtonSelected,
              ]}
              onPress={() => {
                setSelectedMonth(month);
                setShowMonthFilter(false);
              }}
            >
              <Text style={[
                styles.monthButtonText,
                selectedMonth === month && styles.monthButtonTextSelected,
              ]}>
                {getMonthName(month).substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMemberCard = (member: MemberWithStatus, isChecked: boolean) => {
    const isLoading = loadingActions.has(`mark-${member._id}`) || loadingActions.has(`remind-${member._id}`);

    return (
      <View
        key={member._id}
        style={[
          styles.memberCard,
          isChecked ? styles.memberCardPaid : styles.memberCardUnpaid,
        ]}
      >
        {/* Member Avatar */}
        {member.profileImage || member.profilePicture ? (
          <Avatar.Image
            size={40}
            source={{ uri: member.profileImage || member.profilePicture }}
          />
        ) : (
          <Avatar.Text
            size={40}
            label={member.fullName.charAt(0).toUpperCase()}
            style={{ backgroundColor: Colors.primary }}
          />
        )}

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.fullName}</Text>
          <Text style={[
            styles.memberStatus,
            isChecked ? styles.memberStatusPaid : styles.memberStatusUnpaid,
          ]}>
            {isChecked
              ? (activeTab === 'membership' ? t('status.paid') : t('status.valid'))
              : (activeTab === 'membership' ? t('status.notPaid') : t('status.invalid'))
            }
          </Text>
          <Text style={styles.memberLastActive}>
            {formatLastActive(member.lastActive)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.memberActions}>
          {!isChecked && (
            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => handleRemindMember(member)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons
                name="bell-ring"
                size={22}
                color={Colors.error}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => !isChecked && handleMarkMember(member)}
            disabled={isChecked || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View style={[
                styles.checkbox,
                isChecked && styles.checkboxChecked,
              ]}>
                {isChecked && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#fff"
                  />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGroupCard = (group: GroupWithMembers) => {
    const isExpanded = expandedGroups.has(group._id);
    const unpaidCount = group.totalCount - group.paidCount;
    const isRemindingGroup = loadingActions.has(`remind-group-${group._id}`);

    return (
      <View key={group._id} style={styles.groupCardContainer}>
        {/* Group Header */}
        <TouchableOpacity
          style={styles.groupCard}
          onPress={() => toggleGroupExpanded(group._id)}
          activeOpacity={0.7}
        >
          {/* Color indicator */}
          <View style={[styles.groupColorBar, { backgroundColor: group.color || Colors.primary }]} />

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
          </View>

          {/* Member Count */}
          <View style={styles.groupStats}>
            <Text style={styles.groupMemberCount}>
              {group.paidCount}/{group.totalCount}
            </Text>
          </View>

          {/* Reminder Bell */}
          {unpaidCount > 0 && (
            <TouchableOpacity
              style={styles.groupReminderButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemindGroup(group);
              }}
              disabled={isRemindingGroup}
            >
              {isRemindingGroup ? (
                <ActivityIndicator size="small" color={Colors.warning} />
              ) : (
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={22}
                  color={Colors.warning}
                />
              )}
            </TouchableOpacity>
          )}

          {/* Expand Icon */}
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Expanded Members List */}
        {isExpanded && (
          <View style={styles.membersContainer}>
            {group.members.length === 0 ? (
              <Text style={styles.noMembersText}>{t('empty.noMembers')}</Text>
            ) : (
              group.members.map(member =>
                renderMemberCard(
                  member,
                  activeTab === 'membership' ? member.isPaid : member.isValidMedical
                )
              )
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
      {/* Search Bar with Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('groups.searchMembers') || 'Search members...'}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textSecondary}
        />
        {activeTab === 'membership' && (
          <TouchableOpacity
            style={[styles.filterButton, showMonthFilter && styles.filterButtonActive]}
            onPress={() => setShowMonthFilter(!showMonthFilter)}
          >
            <MaterialCommunityIcons
              name="calendar-month"
              size={24}
              color={showMonthFilter ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Month Filter Dropdown */}
      {renderMonthFilter()}

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'membership' && styles.toggleButtonActive,
          ]}
          onPress={() => setActiveTab('membership')}
        >
          <Text style={[
            styles.toggleText,
            activeTab === 'membership' && styles.toggleTextActive,
          ]}>
            {t('payments.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'medical' && styles.toggleButtonActive,
          ]}
          onPress={() => setActiveTab('medical')}
        >
          <Text style={[
            styles.toggleText,
            activeTab === 'medical' && styles.toggleTextActive,
          ]}>
            {t('medical.title')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {totalPaid}/{totalMembers} {activeTab === 'membership' ? t('status.paid').toLowerCase() : t('status.valid').toLowerCase()}
        </Text>
      </View>

      {/* Groups List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>{t('empty.noGroups')}</Text>
          </View>
        ) : (
          filteredGroups.map(group => renderGroupCard(group))
        )}
      </ScrollView>

      {/* Remind All Button */}
      <TouchableOpacity
        style={styles.remindAllButton}
        onPress={handleRemindAll}
        disabled={loadingActions.has('remind-all')}
      >
        {loadingActions.has('remind-all') ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#fff" />
            <Text style={styles.remindAllText}>{t('reminders.remindAllGroups')}</Text>
          </>
        )}
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 0,
    height: 48,
    minHeight: 48,
  },
  searchInput: {
    fontSize: FontSize.sm,
    minHeight: 48,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  monthFilterContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  yearText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: Spacing.lg,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '23%',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  monthButtonSelected: {
    backgroundColor: Colors.primary,
  },
  monthButtonText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  monthButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  progressContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  groupCardContainer: {
    marginBottom: Spacing.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    overflow: 'hidden',
  },
  groupColorBar: {
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
  groupStats: {
    marginRight: Spacing.sm,
  },
  groupMemberCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  groupReminderButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  membersContainer: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    marginTop: -BorderRadius.md,
    paddingTop: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  noMembersText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  memberCardPaid: {
    backgroundColor: Colors.success + '15',
  },
  memberCardUnpaid: {
    backgroundColor: Colors.error + '15',
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
  memberStatus: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  memberStatusPaid: {
    color: Colors.success,
  },
  memberStatusUnpaid: {
    color: Colors.error,
  },
  memberLastActive: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderButton: {
    padding: Spacing.xs,
  },
  checkboxContainer: {
    padding: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  remindAllButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  remindAllText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: '#fff',
  },
});
