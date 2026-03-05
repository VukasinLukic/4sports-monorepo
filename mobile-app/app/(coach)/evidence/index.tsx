import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
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
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Avatar,
  Checkbox,
  IconButton,
  TextInput,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group, Member, PaymentMethod } from '@/types';
import { useRecordPayment } from '@/hooks/useMembers';

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
  isPartial: boolean;
  paymentInfo?: { paidAmount: number; amount: number };
  isValidMedical: boolean;
  lastActive?: string;
  membershipFee?: number; // For dynamic fee support
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

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<MemberWithStatus | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentNote, setPaymentNote] = useState('');
  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordPayment();

  // Medical modal state
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [selectedMemberForMedical, setSelectedMemberForMedical] = useState<MemberWithStatus | null>(null);
  const [medicalCheckDate, setMedicalCheckDate] = useState(new Date());
  const [showMedicalDatePicker, setShowMedicalDatePicker] = useState(false);
  const [isSubmittingMedical, setIsSubmittingMedical] = useState(false);

  // Calculate expiry date (6 months from check date)
  const medicalExpiryDate = new Date(medicalCheckDate);
  medicalExpiryDate.setMonth(medicalExpiryDate.getMonth() + 6);

  // Group medical modal state
  const [showGroupMedicalModal, setShowGroupMedicalModal] = useState(false);
  const [selectedGroupForMedical, setSelectedGroupForMedical] = useState<GroupWithMembers | null>(null);
  const [groupMedicalCheckDate, setGroupMedicalCheckDate] = useState(new Date());
  const [showGroupMedicalDatePicker, setShowGroupMedicalDatePicker] = useState(false);
  const [isSubmittingGroupMedical, setIsSubmittingGroupMedical] = useState(false);

  // Calculate group expiry date (6 months from group check date)
  const groupMedicalExpiryDate = new Date(groupMedicalCheckDate);
  groupMedicalExpiryDate.setMonth(groupMedicalExpiryDate.getMonth() + 6);

  // Default membership fee (will be dynamic when membershipFee is added to Member)
  const DEFAULT_MEMBERSHIP_FEE = 3000;

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
                isPartial: evidence?.status === 'PARTIAL',
                paymentInfo: evidence?.payment ? {
                  paidAmount: evidence.payment.paidAmount ?? 0,
                  amount: evidence.payment.amount ?? 0,
                } : undefined,
                isValidMedical: evidence?.medicalStatus === 'VALID',
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
    if (activeTab === 'membership') {
      // Open payment modal instead of directly marking
      const fee = member.membershipFee || DEFAULT_MEMBERSHIP_FEE;
      setSelectedMemberForPayment(member);
      setPaymentAmount(fee.toString());
      setPaymentMethod(PaymentMethod.CASH);
      setPaymentNote('');
      setShowPaymentModal(true);
      return;
    }

    // Medical tab - open modal instead of directly marking
    setSelectedMemberForMedical(member);
    setMedicalCheckDate(new Date());
    setShowMedicalDatePicker(false);
    setShowMedicalModal(true);
  };

  // Handle payment submission from modal
  const handleSubmitPayment = () => {
    if (!selectedMemberForPayment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), t('validation.validAmount') || 'Unesite validan iznos');
      return;
    }

    const months = [
      'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
      'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar',
    ];

    recordPayment(
      {
        memberId: selectedMemberForPayment._id,
        amount,
        paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        note: paymentNote.trim() || `${months[selectedMonth - 1]} ${selectedYear}`,
        period: {
          month: selectedMonth,
          year: selectedYear,
        },
      },
      {
        onSuccess: () => {
          setShowPaymentModal(false);
          setSelectedMemberForPayment(null);
          fetchData();
          Alert.alert(t('common.success'), t('payments.recordedSuccess') || 'Uplata je uspešno evidentirana!');
        },
        onError: (error: any) => {
          Alert.alert(
            t('common.error'),
            error.response?.data?.message || t('payments.recordFailed') || 'Greška pri evidenciji uplate.'
          );
        },
      }
    );
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedMemberForPayment(null);
  };

  // Handle medical date change
  const handleMedicalDateChange = (event: any, selectedDate?: Date) => {
    setShowMedicalDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setMedicalCheckDate(selectedDate);
    }
  };

  // Handle medical submission from modal
  const handleSubmitMedical = async () => {
    if (!selectedMemberForMedical) return;

    setIsSubmittingMedical(true);

    try {
      await api.post(`/evidence/medical/${selectedMemberForMedical._id}`, {
        lastCheckDate: medicalCheckDate.toISOString(),
        expiryDate: medicalExpiryDate.toISOString(),
      });
      setShowMedicalModal(false);
      setSelectedMemberForMedical(null);
      fetchData();
      Alert.alert(t('common.success'), t('medical.recordedSuccess') || 'Lekarski pregled je uspešno evidentiran!');
    } catch (error) {
      console.error('Error updating medical:', error);
      Alert.alert(t('common.error'), t('medical.recordFailed') || 'Greška pri evidenciji lekarskog pregleda.');
    } finally {
      setIsSubmittingMedical(false);
    }
  };

  const closeMedicalModal = () => {
    setShowMedicalModal(false);
    setSelectedMemberForMedical(null);
  };

  // Handle group medical date change
  const handleGroupMedicalDateChange = (event: any, selectedDate?: Date) => {
    setShowGroupMedicalDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setGroupMedicalCheckDate(selectedDate);
    }
  };

  // Handle group medical submission
  const handleSubmitGroupMedical = async () => {
    if (!selectedGroupForMedical) return;

    setIsSubmittingGroupMedical(true);

    try {
      await Promise.all(
        selectedGroupForMedical.members.map(member =>
          api.post(`/evidence/medical/${member._id}`, {
            lastCheckDate: groupMedicalCheckDate.toISOString(),
            expiryDate: groupMedicalExpiryDate.toISOString(),
          })
        )
      );
      setShowGroupMedicalModal(false);
      setSelectedGroupForMedical(null);
      fetchData();
      Alert.alert(
        t('common.success'),
        `${t('medical.recordedSuccess') || 'Lekarski pregled evidentiran'} (${selectedGroupForMedical.members.length} članova)`
      );
    } catch (error) {
      console.error('Error updating group medical:', error);
      Alert.alert(t('common.error'), t('medical.recordFailed') || 'Greška pri evidenciji lekarskog pregleda.');
    } finally {
      setIsSubmittingGroupMedical(false);
    }
  };

  const closeGroupMedicalModal = () => {
    setShowGroupMedicalModal(false);
    setSelectedGroupForMedical(null);
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
    const isPartial = activeTab === 'membership' && member.isPartial;

    return (
      <View
        key={member._id}
        style={[
          styles.memberCard,
          isChecked ? styles.memberCardPaid : isPartial ? styles.memberCardPartial : styles.memberCardUnpaid,
        ]}
      >
        {/* Member Avatar + Info — tappable → navigate to profile */}
        <TouchableOpacity
          style={styles.memberLeft}
          onPress={() => router.push({ pathname: '/(coach)/members/[id]', params: { id: member._id } })}
          activeOpacity={0.7}
        >
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
              isChecked ? styles.memberStatusPaid : isPartial ? styles.memberStatusPartial : styles.memberStatusUnpaid,
            ]}>
              {isChecked
                ? (activeTab === 'membership' ? t('status.paid') : t('status.valid'))
                : isPartial
                  ? `${t('status.partial')} (${member.paymentInfo?.paidAmount ?? 0}/${member.paymentInfo?.amount ?? 0})`
                  : (activeTab === 'membership' ? t('status.notPaid') : t('status.invalid'))
              }
            </Text>
            <Text style={styles.memberLastActive}>
              {formatLastActive(member.lastActive)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.memberActions}>
          {!isChecked && !isPartial && (
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
                isPartial && styles.checkboxPartial,
              ]}>
                {isChecked && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#fff"
                  />
                )}
                {isPartial && (
                  <MaterialCommunityIcons
                    name="minus"
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

          {/* Group Medical Button — only on medical tab */}
          {activeTab === 'medical' && (
            <TouchableOpacity
              style={styles.groupMedicalButton}
              onPress={() => {
                setSelectedGroupForMedical(group);
                setGroupMedicalCheckDate(new Date());
                setShowGroupMedicalDatePicker(false);
                setShowGroupMedicalModal(true);
              }}
            >
              <MaterialCommunityIcons
                name="stethoscope"
                size={22}
                color={Colors.success}
              />
            </TouchableOpacity>
          )}

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

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('payments.recordPayment') || 'Evidentiraj uplatu'}</Text>
              <TouchableOpacity onPress={closePaymentModal} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Member Info */}
            {selectedMemberForPayment && (
              <View style={styles.modalMemberInfo}>
                {selectedMemberForPayment.profileImage || selectedMemberForPayment.profilePicture ? (
                  <Avatar.Image
                    size={48}
                    source={{ uri: selectedMemberForPayment.profileImage || selectedMemberForPayment.profilePicture }}
                  />
                ) : (
                  <Avatar.Text
                    size={48}
                    label={selectedMemberForPayment.fullName.charAt(0).toUpperCase()}
                    style={{ backgroundColor: Colors.primary }}
                  />
                )}
                <View style={styles.modalMemberDetails}>
                  <Text style={styles.modalMemberName}>{selectedMemberForPayment.fullName}</Text>
                  <Text style={styles.modalMemberPeriod}>
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Text>
                </View>
              </View>
            )}

            {/* Amount Input */}
            <Text style={styles.modalLabel}>{t('payments.amount') || 'Iznos'} *</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.modalInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              textColor={Colors.text}
              right={<TextInput.Affix text="RSD" textStyle={styles.currencyAffix} />}
            />

            {/* Payment Method Toggle */}
            <Text style={styles.modalLabel}>{t('payments.method') || 'Način plaćanja'} *</Text>
            <View style={styles.paymentMethodToggle}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  styles.methodButtonLeft,
                  paymentMethod === PaymentMethod.CASH && styles.methodButtonActive,
                ]}
                onPress={() => setPaymentMethod(PaymentMethod.CASH)}
              >
                <MaterialCommunityIcons
                  name="cash"
                  size={20}
                  color={paymentMethod === PaymentMethod.CASH ? '#fff' : Colors.textSecondary}
                />
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === PaymentMethod.CASH && styles.methodButtonTextActive,
                ]}>
                  {t('payments.cash') || 'Gotovina'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  styles.methodButtonRight,
                  paymentMethod === PaymentMethod.BANK_TRANSFER && styles.methodButtonActive,
                ]}
                onPress={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
              >
                <MaterialCommunityIcons
                  name="bank"
                  size={20}
                  color={paymentMethod === PaymentMethod.BANK_TRANSFER ? '#fff' : Colors.textSecondary}
                />
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === PaymentMethod.BANK_TRANSFER && styles.methodButtonTextActive,
                ]}>
                  {t('payments.bankTransfer') || 'Prenos'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Note Input */}
            <Text style={styles.modalLabel}>{t('common.note') || 'Napomena'} ({t('common.optional') || 'opciono'})</Text>
            <TextInput
              value={paymentNote}
              onChangeText={setPaymentNote}
              mode="outlined"
              style={styles.modalInput}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              textColor={Colors.text}
              placeholder={t('payments.notePlaceholder') || 'npr. Članarina za januar'}
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitPayment}
              loading={isRecordingPayment}
              disabled={isRecordingPayment}
              style={styles.modalSubmitButton}
              icon="check"
              buttonColor={Colors.success}
            >
              {t('payments.recordPayment') || 'Evidentiraj uplatu'}
            </Button>

            {/* Cancel Button */}
            <Button
              mode="outlined"
              onPress={closePaymentModal}
              style={styles.modalCancelButton}
              textColor={Colors.textSecondary}
            >
              {t('common.cancel') || 'Otkaži'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Medical Modal */}
      <Modal
        visible={showMedicalModal}
        transparent
        animationType="slide"
        onRequestClose={closeMedicalModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('medical.recordCheckup') || 'Evidentiraj pregled'}</Text>
              <TouchableOpacity onPress={closeMedicalModal} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Member Info */}
            {selectedMemberForMedical && (
              <View style={styles.modalMemberInfo}>
                {selectedMemberForMedical.profileImage || selectedMemberForMedical.profilePicture ? (
                  <Avatar.Image
                    size={48}
                    source={{ uri: selectedMemberForMedical.profileImage || selectedMemberForMedical.profilePicture }}
                  />
                ) : (
                  <Avatar.Text
                    size={48}
                    label={selectedMemberForMedical.fullName.charAt(0).toUpperCase()}
                    style={{ backgroundColor: Colors.primary }}
                  />
                )}
                <View style={styles.modalMemberDetails}>
                  <Text style={styles.modalMemberName}>{selectedMemberForMedical.fullName}</Text>
                  <Text style={styles.modalMemberPeriod}>
                    {t('medical.checkup') || 'Lekarski pregled'}
                  </Text>
                </View>
              </View>
            )}

            {/* Check Date Picker */}
            <Text style={styles.modalLabel}>{t('medical.lastCheckDate') || 'Datum pregleda'} *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowMedicalDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.datePickerText}>
                {medicalCheckDate.toLocaleDateString('sr-RS', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showMedicalDatePicker && (
              <DateTimePicker
                value={medicalCheckDate}
                mode="date"
                display="default"
                onChange={handleMedicalDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Expiry Date Display */}
            <View style={styles.expiryDateContainer}>
              <View style={styles.expiryDateRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.success} />
                <Text style={styles.expiryDateLabel}>{t('medical.expiryDate') || 'Datum isteka'}:</Text>
              </View>
              <Text style={styles.expiryDateValue}>
                {medicalExpiryDate.toLocaleDateString('sr-RS', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {/* Helper text */}
            <View style={styles.medicalHelperContainer}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.medicalHelperText}>
                {t('medical.sixMonthsValidity') || 'Važi 6 meseci od datuma pregleda'}
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitMedical}
              loading={isSubmittingMedical}
              disabled={isSubmittingMedical}
              style={styles.modalSubmitButton}
              icon="check"
              buttonColor={Colors.success}
            >
              {t('medical.recordCheckup') || 'Evidentiraj pregled'}
            </Button>

            {/* Cancel Button */}
            <Button
              mode="outlined"
              onPress={closeMedicalModal}
              style={styles.modalCancelButton}
              textColor={Colors.textSecondary}
            >
              {t('common.cancel') || 'Otkaži'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Group Medical Modal */}
      <Modal
        visible={showGroupMedicalModal}
        transparent
        animationType="slide"
        onRequestClose={closeGroupMedicalModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('medical.recordCheckup') || 'Evidentiraj pregled'}</Text>
              <TouchableOpacity onPress={closeGroupMedicalModal} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Group Info */}
            {selectedGroupForMedical && (
              <View style={styles.modalMemberInfo}>
                <MaterialCommunityIcons name="account-group" size={48} color={Colors.primary} />
                <View style={styles.modalMemberDetails}>
                  <Text style={styles.modalMemberName}>{selectedGroupForMedical.name}</Text>
                  <Text style={styles.modalMemberPeriod}>
                    {selectedGroupForMedical.members.length} {t('members.title') || 'članova'}
                  </Text>
                </View>
              </View>
            )}

            {/* Check Date Picker */}
            <Text style={styles.modalLabel}>{t('medical.lastCheckDate') || 'Datum pregleda'} *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowGroupMedicalDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.datePickerText}>
                {groupMedicalCheckDate.toLocaleDateString('sr-RS', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showGroupMedicalDatePicker && (
              <DateTimePicker
                value={groupMedicalCheckDate}
                mode="date"
                display="default"
                onChange={handleGroupMedicalDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Expiry Date Display */}
            <View style={styles.expiryDateContainer}>
              <View style={styles.expiryDateRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.success} />
                <Text style={styles.expiryDateLabel}>{t('medical.expiryDate') || 'Datum isteka'}:</Text>
              </View>
              <Text style={styles.expiryDateValue}>
                {groupMedicalExpiryDate.toLocaleDateString('sr-RS', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {/* Helper text */}
            <View style={styles.medicalHelperContainer}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.medicalHelperText}>
                {t('medical.sixMonthsValidity') || 'Važi 6 meseci od datuma pregleda'}
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitGroupMedical}
              loading={isSubmittingGroupMedical}
              disabled={isSubmittingGroupMedical}
              style={styles.modalSubmitButton}
              icon="check"
              buttonColor={Colors.success}
            >
              {t('medical.recordCheckup') || 'Evidentiraj pregled'}
            </Button>

            {/* Cancel Button */}
            <Button
              mode="outlined"
              onPress={closeGroupMedicalModal}
              style={styles.modalCancelButton}
              textColor={Colors.textSecondary}
            >
              {t('common.cancel') || 'Otkaži'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  groupMedicalButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
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
  memberCardPartial: {
    backgroundColor: Colors.warning + '15',
  },
  memberCardUnpaid: {
    backgroundColor: Colors.error + '15',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  memberStatusPartial: {
    color: Colors.warning,
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
  checkboxPartial: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  modalMemberDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  modalMemberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  modalMemberPeriod: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  modalLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Colors.surface,
  },
  currencyAffix: {
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  paymentMethodToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodButtonLeft: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    borderRightWidth: 0,
  },
  methodButtonRight: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  methodButtonActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  methodButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  modalSubmitButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  modalCancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
  medicalHelperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  medicalHelperText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  datePickerText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  expiryDateContainer: {
    backgroundColor: Colors.success + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  expiryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  expiryDateLabel: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: '600',
  },
  expiryDateValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
});
