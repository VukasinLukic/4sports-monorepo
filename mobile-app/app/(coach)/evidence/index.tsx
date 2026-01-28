import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  Avatar,
  Button,
  Menu,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Group } from '@/types';

type EvidenceTab = 'membership' | 'medical';

interface MembershipEvidence {
  memberId: string;
  memberName: string;
  profileImage?: string;
  group?: {
    _id: string;
    name: string;
    color?: string;
  };
  period: {
    month: number;
    year: number;
  };
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'NOT_CREATED';
  payment?: {
    _id: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: string;
  };
}

interface MedicalEvidence {
  memberId: string;
  memberName: string;
  profileImage?: string;
  group?: {
    _id: string;
    name: string;
    color?: string;
  };
  medicalInfo: {
    lastCheckDate?: string;
    expiryDate?: string;
    bloodType?: string;
  };
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_SET';
}

interface EvidenceStats {
  total: number;
  paid?: number;
  pending?: number;
  overdue?: number;
  notCreated?: number;
  valid?: number;
  expiringSoon?: number;
  expired?: number;
  notSet?: number;
}

export default function EvidenceScreen() {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('membership');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Membership state
  const [membershipEvidence, setMembershipEvidence] = useState<MembershipEvidence[]>([]);
  const [membershipStats, setMembershipStats] = useState<EvidenceStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Medical state
  const [medicalEvidence, setMedicalEvidence] = useState<MedicalEvidence[]>([]);
  const [medicalStats, setMedicalStats] = useState<EvidenceStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, []);

  const fetchMembershipEvidence = useCallback(async () => {
    try {
      const params: any = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedGroup) {
        params.groupId = selectedGroup._id;
      }

      const response = await api.get('/evidence/membership', { params });
      setMembershipEvidence(response.data.data.evidence || []);
      setMembershipStats(response.data.data.stats || null);
    } catch (error) {
      console.error('Error fetching membership evidence:', error);
    }
  }, [selectedGroup, selectedMonth, selectedYear]);

  const fetchMedicalEvidence = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedGroup) {
        params.groupId = selectedGroup._id;
      }

      const response = await api.get('/evidence/medical', { params });
      setMedicalEvidence(response.data.data.evidence || []);
      setMedicalStats(response.data.data.stats || null);
    } catch (error) {
      console.error('Error fetching medical evidence:', error);
    }
  }, [selectedGroup]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await fetchGroups();
    if (activeTab === 'membership') {
      await fetchMembershipEvidence();
    } else {
      await fetchMedicalEvidence();
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [activeTab, fetchGroups, fetchMembershipEvidence, fetchMedicalEvidence]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleMarkAsPaid = async (member: MembershipEvidence) => {
    try {
      await api.post(`/evidence/membership/${member.memberId}`, {
        month: selectedMonth,
        year: selectedYear,
        paymentMethod: 'CASH',
      });
      Alert.alert('Success', `${member.memberName} marked as paid`);
      fetchMembershipEvidence();
    } catch (error) {
      console.error('Error marking as paid:', error);
      Alert.alert('Error', 'Failed to mark as paid');
    }
  };

  const handleUpdateMedical = async (member: MedicalEvidence) => {
    // Calculate expiry date 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    try {
      await api.post(`/evidence/medical/${member.memberId}`, {
        lastCheckDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
      });
      Alert.alert('Success', `${member.memberName} medical updated`);
      fetchMedicalEvidence();
    } catch (error) {
      console.error('Error updating medical:', error);
      Alert.alert('Error', 'Failed to update medical info');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'VALID':
        return Colors.success;
      case 'PENDING':
      case 'EXPIRING_SOON':
        return Colors.warning;
      case 'OVERDUE':
      case 'EXPIRED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'OVERDUE':
        return 'Overdue';
      case 'NOT_CREATED':
        return 'Not Created';
      case 'VALID':
        return 'Valid';
      case 'EXPIRING_SOON':
        return 'Expiring Soon';
      case 'EXPIRED':
        return 'Expired';
      case 'NOT_SET':
        return 'Not Set';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[month - 1];
  };

  const renderMembershipItem = ({ item }: { item: MembershipEvidence }) => (
    <Card style={styles.itemCard}>
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemRow}>
          {item.profileImage ? (
            <Avatar.Image size={48} source={{ uri: item.profileImage }} />
          ) : (
            <Avatar.Text
              size={48}
              label={item.memberName.charAt(0).toUpperCase()}
              style={{ backgroundColor: item.group?.color || Colors.primary }}
            />
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.memberName}>{item.memberName}</Text>
            {item.group && (
              <Text style={styles.groupName}>{item.group.name}</Text>
            )}
            {item.payment && (
              <Text style={styles.amountText}>
                {item.payment.amount > 0 ? `${item.payment.amount} RSD` : '-'}
              </Text>
            )}
          </View>

          <View style={styles.itemActions}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '30' }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Chip>
            {item.status !== 'PAID' && (
              <IconButton
                icon="check-circle"
                iconColor={Colors.success}
                size={24}
                onPress={() => handleMarkAsPaid(item)}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMedicalItem = ({ item }: { item: MedicalEvidence }) => (
    <Card style={styles.itemCard}>
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemRow}>
          {item.profileImage ? (
            <Avatar.Image size={48} source={{ uri: item.profileImage }} />
          ) : (
            <Avatar.Text
              size={48}
              label={item.memberName.charAt(0).toUpperCase()}
              style={{ backgroundColor: item.group?.color || Colors.primary }}
            />
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.memberName}>{item.memberName}</Text>
            {item.group && (
              <Text style={styles.groupName}>{item.group.name}</Text>
            )}
            <Text style={styles.dateText}>
              Expires: {formatDate(item.medicalInfo.expiryDate)}
            </Text>
          </View>

          <View style={styles.itemActions}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '30' }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Chip>
            {item.status !== 'VALID' && (
              <IconButton
                icon="medical-bag"
                iconColor={Colors.success}
                size={24}
                onPress={() => handleUpdateMedical(item)}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStats = () => {
    const stats = activeTab === 'membership' ? membershipStats : medicalStats;
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        {activeTab === 'membership' ? (
          <>
            <View style={[styles.statBox, { backgroundColor: Colors.success + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.paid || 0}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.warning + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.pending || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.error + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.error }]}>{stats.overdue || 0}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statBox, { backgroundColor: Colors.success + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.valid || 0}</Text>
              <Text style={styles.statLabel}>Valid</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.warning + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.expiringSoon || 0}</Text>
              <Text style={styles.statLabel}>Expiring</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.error + '20' }]}>
              <Text style={[styles.statNumber, { color: Colors.error }]}>{stats.expired || 0}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading evidence...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EvidenceTab)}
          buttons={[
            { value: 'membership', label: 'Membership', icon: 'cash' },
            { value: 'medical', label: 'Medical', icon: 'medical-bag' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Group Filter */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              icon="filter-variant"
              style={styles.filterButton}
              contentStyle={styles.filterButtonContent}
            >
              {selectedGroup ? selectedGroup.name : 'All Groups'}
            </Button>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            onPress={() => {
              setSelectedGroup(null);
              setMenuVisible(false);
            }}
            title="All Groups"
          />
          {groups.map((group) => (
            <Menu.Item
              key={group._id}
              onPress={() => {
                setSelectedGroup(group);
                setMenuVisible(false);
              }}
              title={group.name}
            />
          ))}
        </Menu>

        {/* Month/Year Filter (only for membership) */}
        {activeTab === 'membership' && (
          <View style={styles.periodFilter}>
            <TouchableOpacity
              onPress={() => {
                if (selectedMonth === 1) {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
              style={styles.periodArrow}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.periodText}>
              {getMonthName(selectedMonth)} {selectedYear}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedMonth === 12) {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
              style={styles.periodArrow}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats */}
      {renderStats()}

      {/* List */}
      <FlatList
        data={activeTab === 'membership' ? membershipEvidence : medicalEvidence}
        renderItem={activeTab === 'membership' ? renderMembershipItem : renderMedicalItem}
        keyExtractor={(item) => item.memberId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={activeTab === 'membership' ? 'cash-remove' : 'medical-bag'}
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No members found</Text>
            <Text style={styles.emptySubtext}>
              {selectedGroup
                ? 'No members in this group'
                : 'Add members to start tracking'}
            </Text>
          </View>
        }
      />
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
  tabContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  segmentedButtons: {
    backgroundColor: Colors.surface,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    borderColor: Colors.border,
  },
  filterButtonContent: {
    flexDirection: 'row-reverse',
  },
  menuContent: {
    backgroundColor: Colors.surface,
  },
  periodFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  periodArrow: {
    padding: Spacing.xs,
  },
  periodText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  itemContent: {
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  groupName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
    justifyContent: 'center',
  },
  statusChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: FontSize.xs + 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
