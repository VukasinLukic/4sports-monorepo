import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { PaymentStatus, Attendance, Payment, Member } from '@/types';
import api from '@/services/api';

type TabValue = 'profile' | 'membership' | 'attendance';

const MONTHS_SR = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EvidencijaScreen() {
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('membership'); // Default to Uplate

  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);

  const months = language === 'sr' ? MONTHS_SR : MONTHS_EN;

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, paymentsRes, attendanceRes] = await Promise.all([
        api.get('/members/me'),
        api.get('/payments/me'),
        api.get('/attendance/me'),
      ]);

      setMember(memberRes.data.data);
      setPayments(paymentsRes.data.data || []);

      const attendanceData = attendanceRes.data.data;
      if (attendanceData) {
        setAttendance(attendanceData.attendance || []);
        setAttendanceRate(attendanceData.attendanceRate || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString();
  };

  const getGroupName = () => {
    if (member?.groupId) {
      if (typeof member.groupId === 'object' && (member.groupId as any)?.name) {
        return (member.groupId as any).name;
      }
    }
    if (member?.clubs && member.clubs.length > 0) {
      const activeClub = member.clubs.find((c: any) => c.status === 'ACTIVE') || member.clubs[0];
      if (activeClub?.groupId) {
        if (typeof activeClub.groupId === 'object' && (activeClub.groupId as any)?.name) {
          return (activeClub.groupId as any).name;
        }
      }
    }
    return t('members.noGroup');
  };

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: '/(member)/events/[id]',
      params: { id: eventId },
    });
  };

  // Calculate membership stats
  const calculateMembershipStats = () => {
    const DEFAULT_MONTHLY_FEE = 3000;
    const monthlyFee = member?.membershipFee || DEFAULT_MONTHLY_FEE;

    // Use club joinedAt date if available, otherwise use member createdAt
    let joinDate = member?.createdAt ? new Date(member.createdAt) : new Date();
    if (member?.clubs && member.clubs.length > 0) {
      const activeClub = member.clubs.find((c: any) => c.status === 'ACTIVE') || member.clubs[0];
      if (activeClub?.joinedAt) {
        joinDate = new Date(activeClub.joinedAt);
      }
    }

    const now = new Date();
    const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()) + 1;
    const monthsTraining = Math.max(1, monthsDiff);

    const totalExpected = monthsTraining * monthlyFee;

    const totalPaid = payments
      .filter((p: Payment) => p.status === 'PAID' || p.status === 'PARTIAL')
      .reduce((sum: number, p: Payment) => sum + (p.paidAmount ?? p.amount ?? 0), 0);

    const debt = Math.max(0, totalExpected - totalPaid);

    return { monthlyFee, monthsTraining, totalExpected, totalPaid, debt };
  };

  // Generate monthly payment history
  const generateMonthlyHistory = () => {
    const stats = calculateMembershipStats();
    const history: { month: string; year: number; amount: number; status: 'PAID' | 'PARTIAL' | 'UNPAID'; monthIndex: number }[] = [];

    const now = new Date();
    const joinDate = member?.createdAt ? new Date(member.createdAt) : new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const joinMonth = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
      if (date < joinMonth) break;

      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      const monthPayments = payments.filter((p: Payment) => {
        if (p.period?.month && p.period?.year) {
          return p.period.month === (monthIndex + 1) && p.period.year === year;
        }
        const pDate = new Date(p.paidDate || p.createdAt);
        return pDate.getMonth() === monthIndex && pDate.getFullYear() === year;
      });

      const paidAmount = monthPayments
        .filter((p: Payment) => p.status === 'PAID' || p.status === 'PARTIAL')
        .reduce((sum: number, p: Payment) => sum + (p.paidAmount ?? p.amount ?? 0), 0);

      let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
      if (paidAmount >= stats.monthlyFee) {
        status = 'PAID';
      } else if (paidAmount > 0) {
        status = 'PARTIAL';
      }

      history.push({
        month: months[monthIndex],
        year,
        amount: paidAmount,
        status,
        monthIndex,
      });
    }

    return history;
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>{t('errors.notFound')}</Text>
      </View>
    );
  }

  const isPaid = member.paymentStatus === PaymentStatus.PAID;
  const isUnpaid = member.paymentStatus === PaymentStatus.UNPAID;
  const isMedicalValid = member.medicalCheckStatus === 'VALID';
  const stats = calculateMembershipStats();
  const monthlyHistory = generateMonthlyHistory();

  // Tab button component
  const TabButton = ({ value, label, icon }: { value: TabValue; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === value && styles.tabButtonActive]}
      onPress={() => setActiveTab(value)}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={activeTab === value ? '#fff' : Colors.text}
      />
      <Text style={[styles.tabButtonText, activeTab === value && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render Profile Tab
  const renderProfileTab = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>{t('members.memberDetails')}</Text>
        <Divider style={styles.divider} />

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="cake-variant" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.dateOfBirth')}:</Text>
          <Text style={styles.detailValue}>{formatDate(member.dateOfBirth)}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="counter" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.age')}:</Text>
          <Text style={styles.detailValue}>{member.age ? `${member.age} ${t('members.years')}` : '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="soccer" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.position')}:</Text>
          <Text style={styles.detailValue}>{(member as any).position || '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="tshirt-crew" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.jerseyNumber')}:</Text>
          <Text style={styles.detailValue}>{member.jerseyNumber || '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="ruler" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.height')}:</Text>
          <Text style={styles.detailValue}>{(member as any).height ? `${(member as any).height} cm` : '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="scale" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.weight')}:</Text>
          <Text style={styles.detailValue}>{(member as any).weight ? `${(member as any).weight} kg` : '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="hospital-box" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('medical.expiryDate')}:</Text>
          <Text style={[styles.detailValue, { color: isMedicalValid ? Colors.success : Colors.error }]}>
            {formatDate((member as any).medicalCheckExpiryDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.joinDate')}:</Text>
          <Text style={styles.detailValue}>{formatDate(member.createdAt)}</Text>
        </View>

        {/* Parent Contact Info */}
        {(member as any).parentPhone && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone" size={20} color={Colors.textSecondary} />
              <Text style={styles.detailLabel}>{t('members.parentPhone')}:</Text>
              <Text style={styles.detailValue}>{(member as any).parentPhone}</Text>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  // Render Membership Tab
  const renderMembershipTab = () => (
    <>
      {/* Summary Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statWithEditRow}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.monthlyFee} RSD</Text>
                <Text style={styles.statLabel}>{t('payments.membershipFee')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.monthsTraining}</Text>
                <Text style={styles.statLabel}>{t('time.months')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: stats.debt > 0 ? Colors.error : Colors.success }]}>
                  {stats.debt} RSD
                </Text>
                <Text style={styles.statLabel}>{t('payments.debt')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editMembershipButton}
              onPress={() => router.push('/profile/edit')}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly History */}
      <Text style={styles.sectionHeader}>{t('payments.paymentHistory')}</Text>
      {monthlyHistory.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="cash-remove" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('payments.noPayments')}</Text>
          </Card.Content>
        </Card>
      ) : (
        monthlyHistory.map((item, index) => (
          <Card key={index} style={styles.historyCard}>
            <Card.Content style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyMonth}>{item.month} {item.year}</Text>
                <Text style={styles.historyAmount}>{item.amount} / {stats.monthlyFee} RSD</Text>
              </View>
              <View style={[
                styles.historyStatus,
                { backgroundColor: item.status === 'PAID' ? Colors.success + '20' : item.status === 'PARTIAL' ? Colors.warning + '20' : Colors.error + '20' }
              ]}>
                <Text style={[
                  styles.historyStatusText,
                  { color: item.status === 'PAID' ? Colors.success : item.status === 'PARTIAL' ? Colors.warning : Colors.error }
                ]}>
                  {item.status === 'PAID' ? t('status.paid') : item.status === 'PARTIAL' ? t('status.partial') : t('status.notPaid')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </>
  );

  // Render Attendance Tab
  const renderAttendanceTab = () => {
    const presentCount = attendance.filter((a: Attendance) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const calculatedRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : attendanceRate;

    return (
      <>
        {/* Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.attendanceSummary}>
              <View style={styles.rateCircle}>
                <Text style={styles.rateNumber}>{calculatedRate}%</Text>
              </View>
              <View style={styles.attendanceStats}>
                <View style={styles.attendanceStatRow}>
                  <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.attendanceStatLabel}>{t('status.present')}</Text>
                  <Text style={styles.attendanceStatValue}>
                    {attendance.filter((a: Attendance) => a.status === 'PRESENT').length}
                  </Text>
                </View>
                <View style={styles.attendanceStatRow}>
                  <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.attendanceStatLabel}>{t('status.late')}</Text>
                  <Text style={styles.attendanceStatValue}>
                    {attendance.filter((a: Attendance) => a.status === 'LATE').length}
                  </Text>
                </View>
                <View style={styles.attendanceStatRow}>
                  <View style={[styles.dot, { backgroundColor: Colors.error }]} />
                  <Text style={styles.attendanceStatLabel}>{t('status.absent')}</Text>
                  <Text style={styles.attendanceStatValue}>
                    {attendance.filter((a: Attendance) => a.status === 'ABSENT').length}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* History */}
        <Text style={styles.sectionHeader}>{t('attendance.attendanceRecord')}</Text>
        {attendance.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('attendance.noRecords')}</Text>
            </Card.Content>
          </Card>
        ) : (
          attendance.slice(0, 10).map((record: Attendance) => {
            const isPresent = record.status === 'PRESENT' || record.status === 'LATE';
            const statusColor = record.status === 'PRESENT' ? Colors.success :
              record.status === 'LATE' ? Colors.warning :
              record.status === 'EXCUSED' ? Colors.info : Colors.error;

            const rawType = typeof record.eventId === 'object' && (record.eventId as any)?.type
              ? (record.eventId as any).type
              : 'TRAINING';
            const knownTypes = ['TRAINING', 'MATCH', 'OTHER'];
            const eventType = knownTypes.includes(rawType.toUpperCase())
              ? t(`eventTypes.${rawType.toLowerCase()}`)
              : rawType;
            const eventId = typeof record.eventId === 'object' ? (record.eventId as any)?._id : record.eventId;
            const eventDate = typeof record.eventId === 'object' && (record.eventId as any)?.date
              ? (record.eventId as any).date
              : (record.markedAt || record.createdAt);

            const statusLabel = record.status === 'PRESENT' ? t('status.present') :
              record.status === 'LATE' ? t('status.late') :
              record.status === 'EXCUSED' ? t('status.excused') : t('status.absent');

            return (
              <TouchableOpacity
                key={record._id}
                onPress={() => eventId && handleEventPress(eventId)}
                activeOpacity={0.7}
              >
                <Card style={[styles.historyCard, !isPresent && styles.absentCard]}>
                  <Card.Content style={styles.attendanceRow}>
                    <View style={[styles.attendanceIndicator, { backgroundColor: statusColor }]}>
                      <MaterialCommunityIcons
                        name={isPresent ? 'check' : 'close'}
                        size={16}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.attendanceInfo}>
                      <Text style={[styles.attendanceType, !isPresent && styles.absentText]}>
                        {eventType}
                      </Text>
                      <Text style={styles.attendanceDate}>{formatDate(eventDate)}</Text>
                    </View>
                    <View style={[styles.attendanceStatusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.attendanceStatusText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Compact Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.headerRow}>
            {/* Avatar */}
            {(member as any).profilePicture ? (
              <Image source={{ uri: (member as any).profilePicture }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={64} label={getInitials(member.fullName)} style={styles.avatarPlaceholder} />
            )}

            {/* Info */}
            <View style={[styles.headerInfo, styles.headerInfoWithEdit]}>
              <View style={styles.headerTitleRow}>
                <View>
                  <Text style={styles.memberName}>{member.fullName}</Text>
                  <Text style={styles.memberGroup}>{getGroupName()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push('/profile/edit')}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Status badges row */}
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: isPaid ? Colors.success + '20' : Colors.error + '20' }]}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={12}
                    color={isPaid ? Colors.success : Colors.error}
                  />
                  <Text style={[styles.statusBadgeText, { color: isPaid ? Colors.success : Colors.error }]}>
                    {isPaid ? t('status.paid') : isUnpaid ? t('status.unpaid') : t('status.partial')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isMedicalValid ? Colors.success + '20' : Colors.error + '20' }]}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={12}
                    color={isMedicalValid ? Colors.success : Colors.error}
                  />
                  <Text style={[styles.statusBadgeText, { color: isMedicalValid ? Colors.success : Colors.error }]}>
                    {isMedicalValid ? t('status.valid') : t('status.expired')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TabButton value="profile" label={t('navigation.profile') || 'Profil'} icon="account" />
        <TabButton value="membership" label={t('payments.title') || 'Uplate'} icon="cash" />
        <TabButton value="attendance" label={t('attendance.title') || 'Prisustvo'} icon="calendar-check" />
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'membership' && renderMembershipTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}
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
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  // Header styles
  headerCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  headerContent: {
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerInfoWithEdit: {
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  editButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '15',
  },
  memberName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  memberGroup: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.success,
  },
  tabButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  // Card styles
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    marginVertical: Spacing.sm,
    backgroundColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  // Stats grid
  statWithEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  editMembershipButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '15',
  },
  // Section
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  // History cards
  historyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
  },
  historyMonth: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  historyAmount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyStatus: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  historyStatusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Attendance card styles
  absentCard: {
    opacity: 0.7,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceType: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  absentText: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  attendanceDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  attendanceStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  attendanceStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  // Attendance summary
  attendanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  rateCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  attendanceStats: {
    flex: 1,
    gap: Spacing.xs,
  },
  attendanceStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  attendanceStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  attendanceStatValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
