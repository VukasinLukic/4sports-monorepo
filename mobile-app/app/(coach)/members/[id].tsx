import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useMember, useMemberAttendance, useMemberPayments } from '@/hooks/useMembers';
import { useLanguage } from '@/services/LanguageContext';
import { Attendance, Payment } from '@/types';
import api from '@/services/api';

type TabValue = 'profile' | 'membership' | 'attendance';

const MONTHS_SR = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MemberDetailsScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [sendingReminder, setSendingReminder] = useState<'payment' | 'medical' | null>(null);

  const { data: member, isLoading, refetch: refetchMember } = useMember(memberId);
  const { data: attendance = [], refetch: refetchAttendance } = useMemberAttendance(memberId);
  const { data: payments = [], refetch: refetchPayments } = useMemberPayments(memberId);

  const months = language === 'sr' ? MONTHS_SR : MONTHS_EN;

  useFocusEffect(
    useCallback(() => {
      refetchMember();
      refetchAttendance();
      refetchPayments();
    }, [refetchMember, refetchAttendance, refetchPayments])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMember(), refetchAttendance(), refetchPayments()]);
    setIsRefreshing(false);
  };

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString();
  };

  const getLastActiveDate = () => {
    // Find the most recent attendance where member was present or late
    const presentRecords = attendance.filter((a: Attendance) =>
      a.status === 'PRESENT' || a.status === 'LATE'
    );
    if (presentRecords.length === 0) return '--';

    // Sort by date descending and get the most recent
    const sortedRecords = presentRecords.sort((a: Attendance, b: Attendance) => {
      const dateA = typeof a.eventId === 'object' && a.eventId?.date
        ? new Date(a.eventId.date)
        : new Date(a.markedAt);
      const dateB = typeof b.eventId === 'object' && b.eventId?.date
        ? new Date(b.eventId.date)
        : new Date(b.markedAt);
      return dateB.getTime() - dateA.getTime();
    });

    const lastRecord = sortedRecords[0];
    const lastDate = typeof lastRecord.eventId === 'object' && lastRecord.eventId?.date
      ? lastRecord.eventId.date
      : lastRecord.markedAt;

    return formatDate(lastDate);
  };

  const getGroupName = () => {
    // Check direct groupId first
    if (member?.groupId) {
      if (typeof member.groupId === 'object' && member.groupId?.name) {
        return member.groupId.name;
      }
    }
    // Check clubs array structure
    if (member?.clubs && member.clubs.length > 0) {
      const activeClub = member.clubs.find((c: any) => c.status === 'ACTIVE') || member.clubs[0];
      if (activeClub?.groupId) {
        if (typeof activeClub.groupId === 'object' && activeClub.groupId?.name) {
          return activeClub.groupId.name;
        }
      }
    }
    // Check groupName directly
    if (member?.groupName) {
      return member.groupName;
    }
    return t('members.noGroup');
  };

  const handleSendReminder = async (type: 'payment' | 'medical') => {
    setSendingReminder(type);
    try {
      await api.post(`/reminders/${type}/member/${memberId}`);
      Alert.alert(
        t('common.success'),
        type === 'payment' ? t('reminders.paymentSent') : t('reminders.medicalSent')
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('reminders.failedToSend'));
    } finally {
      setSendingReminder(null);
    }
  };

  const handleEditMember = () => {
    router.push({
      pathname: '/(coach)/members/edit',
      params: { id: memberId },
    });
  };

  const handleStartChat = async () => {
    if (!member?.userId) {
      Alert.alert(
        t('common.error') || 'Greška',
        t('chat.memberNoAccount') || 'Ovaj član nema korisnički nalog i ne može primati poruke. Član mora da se registruje preko aplikacije da bi mogao da koristi chat.'
      );
      return;
    }
    try {
      const response = await api.post('/chat/conversations', {
        participantIds: [member.userId],
      });
      const conversationId = response.data.data.conversationId || response.data.data._id;
      router.push(`/(coach)/chat/${conversationId}` as any);
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

  const handleEventPress = (eventId: string) => {
    router.push({
      pathname: '/(coach)/events/[id]',
      params: { id: eventId },
    });
  };

  // Calculate membership stats
  const calculateMembershipStats = () => {
    const DEFAULT_MONTHLY_FEE = 3000;
    const monthlyFee = member?.membershipFee || DEFAULT_MONTHLY_FEE;
    const joinDate = member?.createdAt ? new Date(member.createdAt) : new Date();
    const now = new Date();

    // Calculate months since joining
    const monthsDiff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()) + 1;
    const monthsTraining = Math.max(1, monthsDiff);

    // Calculate totalExpected from actual payment amounts (with fallback to monthlyFee)
    const membershipPayments = payments.filter((p: Payment) => p.type === 'MEMBERSHIP');
    const totalExpected = membershipPayments.length > 0
      ? membershipPayments.reduce((sum: number, p: Payment) => sum + (p.amount ?? monthlyFee), 0)
      : monthsTraining * monthlyFee;

    // Total paid (include PARTIAL payments, use paidAmount field)
    const totalPaid = membershipPayments
      .filter((p: Payment) => p.status === 'PAID' || p.status === 'PARTIAL')
      .reduce((sum: number, p: Payment) => sum + (p.paidAmount ?? p.amount ?? 0), 0);

    // Debt
    const debt = Math.max(0, totalExpected - totalPaid);

    // Payment months = number of months with payment records
    const paymentMonths = membershipPayments.length;

    return { monthlyFee, monthsTraining, paymentMonths, totalExpected, totalPaid, debt };
  };

  // Generate monthly payment history for ALL months with data
  const generateMonthlyHistory = () => {
    const stats = calculateMembershipStats();
    const history: { month: string; year: number; amount: number; expectedAmount: number; status: 'PAID' | 'PARTIAL' | 'UNPAID'; monthIndex: number }[] = [];

    const now = new Date();

    // Debug logging
    console.log('Payments received:', payments.length, payments);

    // Find earliest payment to determine how many months back to go
    const membershipPayments = payments.filter((p: Payment) => p.type === 'MEMBERSHIP');

    if (membershipPayments.length > 0) {
      console.log('PAYMENT STRUCTURE - First payment:', JSON.stringify(membershipPayments[0], null, 2));
      console.log('Payment keys:', Object.keys(membershipPayments[0]));
      console.log('Has amount field?', 'amount' in membershipPayments[0], membershipPayments[0]?.amount);
    }
    let monthsToGenerate = 12; // Default to 12

    if (membershipPayments.length > 0) {
      // Sort by period or date to find earliest
      const sortedPayments = [...membershipPayments].sort((a, b) => {
        const aDate = a.period ? new Date(a.period.year, a.period.month - 1) : new Date(a.paidDate || a.createdAt);
        const bDate = b.period ? new Date(b.period.year, b.period.month - 1) : new Date(b.paidDate || b.createdAt);
        return aDate.getTime() - bDate.getTime();
      });

      const earliestPayment = sortedPayments[0];
      const earliestDate = earliestPayment.period
        ? new Date(earliestPayment.period.year, earliestPayment.period.month - 1)
        : new Date(earliestPayment.paidDate || earliestPayment.createdAt);

      const monthsDiff = (now.getFullYear() - earliestDate.getFullYear()) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1;
      monthsToGenerate = Math.max(12, monthsDiff);

      console.log('Earliest payment:', earliestDate, 'Months to generate:', monthsToGenerate);
    }

    // Generate all months from now back to earliest payment
    for (let i = 0; i < monthsToGenerate; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      // Find payments for this month - check period first, then fallback to paidDate/createdAt
      const monthPayments = payments.filter((p: Payment) => {
        // Check if payment has period object
        if (p.period?.month && p.period?.year) {
          return p.period.month === (monthIndex + 1) && p.period.year === year;
        }
        // Fallback to paidDate or createdAt
        const pDate = new Date(p.paidDate || p.createdAt);
        return pDate.getMonth() === monthIndex && pDate.getFullYear() === year;
      });

      const paidAmount = monthPayments
        .filter((p: Payment) => p.status === 'PAID' || p.status === 'PARTIAL')
        .reduce((sum: number, p: Payment) => sum + (p.paidAmount ?? p.amount ?? 0), 0);

      // Get the expected amount for this month (from the payment record)
      const expectedAmount = monthPayments.length > 0
        ? monthPayments[0].amount ?? stats.monthlyFee
        : stats.monthlyFee;

      let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
      if (paidAmount >= expectedAmount) {
        status = 'PAID';
      } else if (paidAmount > 0) {
        status = 'PARTIAL';
      }

      // Debug January or current month
      if ((monthIndex === 0 && i < 3) || i === 0) {
        console.log(`[Payment History] ${months[monthIndex]} ${year}:`, {
          monthPayments: monthPayments.length,
          amount: monthPayments[0]?.amount,
          paidAmount,
          expectedAmount,
          status
        });
      }

      history.push({
        month: months[monthIndex],
        year,
        amount: paidAmount,
        expectedAmount,
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
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          {t('common.goBack')}
        </Button>
      </View>
    );
  }

  // Calculate payment status based on CURRENT MONTH only
  const calculatePaymentStatus = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Find current month's payment
    const currentMonthPayment = payments.find((p: Payment) =>
      p.type === 'MEMBERSHIP' &&
      p.period?.month === currentMonth &&
      p.period?.year === currentYear
    );

    // If no payment record for current month, assume unpaid
    if (!currentMonthPayment) return 'UNPAID';

    const paidAmount = currentMonthPayment.paidAmount ?? 0;
    const totalAmount = currentMonthPayment.amount ?? 0;

    if (paidAmount === 0) {
      return 'UNPAID';
    } else if (paidAmount >= totalAmount) {
      return 'PAID';
    } else {
      return 'PARTIAL';
    }
  };

  const calculatedPaymentStatus = calculatePaymentStatus();
  const isPaid = calculatedPaymentStatus === 'PAID';
  const isPartialPaid = calculatedPaymentStatus === 'PARTIAL';
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
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('members.memberDetails')}</Text>
          <TouchableOpacity onPress={handleEditMember} style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.detailValue}>{member.position || '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="tshirt-crew" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.jerseyNumber')}:</Text>
          <Text style={styles.detailValue}>{member.jerseyNumber || '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="ruler" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.height')}:</Text>
          <Text style={styles.detailValue}>{member.height ? `${member.height} cm` : '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="scale" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.weight')}:</Text>
          <Text style={styles.detailValue}>{member.weight ? `${member.weight} kg` : '--'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="hospital-box" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('medical.expiryDate')}:</Text>
          <Text style={[styles.detailValue, { color: isMedicalValid ? Colors.success : Colors.error }]}>
            {formatDate(member.medicalCheckExpiryDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>{t('members.joinDate')}:</Text>
          <Text style={styles.detailValue}>{formatDate(member.createdAt)}</Text>
        </View>

        {/* Parent Contact - always show in main details if available */}
        {member.parentPhone && (
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => Linking.openURL(`tel:${member.parentPhone}`)}
          >
            <MaterialCommunityIcons name="phone" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>{t('members.parentPhone')}:</Text>
            <Text style={[styles.detailValue, { color: Colors.primary }]}>{member.parentPhone}</Text>
          </TouchableOpacity>
        )}

        {/* Additional Parent Info Section */}
        {(member.parentName || member.parentEmail) && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.cardTitle}>{t('members.parentInfo')}</Text>

            {member.parentName && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="account" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>{t('members.parentName')}:</Text>
                <Text style={styles.detailValue}>{member.parentName}</Text>
              </View>
            )}

            {member.parentEmail && (
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => Linking.openURL(`mailto:${member.parentEmail}`)}
              >
                <MaterialCommunityIcons name="email" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>{t('members.parentEmail')}:</Text>
                <Text style={[styles.detailValue, { color: Colors.primary }]}>{member.parentEmail}</Text>
              </TouchableOpacity>
            )}
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
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.monthlyFee} RSD</Text>
              <Text style={styles.statLabel}>{t('payments.membershipFee')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.paymentMonths}</Text>
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
                <Text style={styles.historyAmount}>{item.amount} / {item.expectedAmount} RSD</Text>
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

      <Button
        mode="contained"
        icon="cash-plus"
        onPress={() => router.push({
          pathname: '/(coach)/payments/record',
          params: { memberId: member._id, memberName: member.fullName }
        })}
        style={styles.actionButton}
        buttonColor={Colors.success}
      >
        {t('payments.recordPayment')}
      </Button>
    </>
  );

  // Render Attendance Tab
  const renderAttendanceTab = () => {
    const presentCount = attendance.filter((a: Attendance) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

    return (
      <>
        {/* Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.attendanceSummary}>
              <View style={styles.rateCircle}>
                <Text style={styles.rateNumber}>{attendanceRate}%</Text>
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

            // Get event type - only translate known types (TRAINING, MATCH, OTHER)
            const rawType = typeof record.eventId === 'object' && record.eventId?.type
              ? record.eventId.type
              : 'TRAINING';
            const knownTypes = ['TRAINING', 'MATCH', 'OTHER'];
            const eventType = knownTypes.includes(rawType.toUpperCase())
              ? t(`eventTypes.${rawType.toLowerCase()}`)
              : rawType; // Show custom type as-is
            const eventId = typeof record.eventId === 'object' ? record.eventId?._id : record.eventId;
            // Always try to get date - use event date, then markedAt, then createdAt
            const eventDate = typeof record.eventId === 'object' && record.eventId?.date
              ? record.eventId.date
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
    <View style={styles.mainContainer}>
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
            {member.profilePicture ? (
              <Image source={{ uri: member.profilePicture }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={64} label={getInitials(member.fullName)} style={styles.avatarPlaceholder} />
            )}

            {/* Info */}
            <View style={styles.headerInfo}>
              <Text style={styles.memberName}>{member.fullName}</Text>
              <Text style={styles.memberGroup}>{getGroupName()}</Text>

              {/* Info badges row */}
              <View style={styles.badgesRow}>
                <View style={styles.infoBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoBadgeText}>
                    {t('members.lastActive')}: {getLastActiveDate()}
                  </Text>
                </View>
              </View>

              {/* Status badges row */}
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: isPaid ? Colors.success + '20' : isPartialPaid ? Colors.warning + '20' : Colors.error + '20' }]}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={12}
                    color={isPaid ? Colors.success : isPartialPaid ? Colors.warning : Colors.error}
                  />
                  <Text style={[styles.statusBadgeText, { color: isPaid ? Colors.success : isPartialPaid ? Colors.warning : Colors.error }]}>
                    {isPaid ? t('status.paid') : isPartialPaid ? t('status.partial') : t('status.notPaid')}
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

            {/* Reminder bells */}
            <View style={styles.reminderButtons}>
              {!isPaid && !isPartialPaid && (
                <TouchableOpacity
                  style={styles.reminderButton}
                  onPress={() => handleSendReminder('payment')}
                  disabled={sendingReminder === 'payment'}
                >
                  <MaterialCommunityIcons
                    name="bell-ring"
                    size={20}
                    color={Colors.warning}
                  />
                </TouchableOpacity>
              )}
              {!isMedicalValid && (
                <TouchableOpacity
                  style={styles.reminderButton}
                  onPress={() => handleSendReminder('medical')}
                  disabled={sendingReminder === 'medical'}
                >
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={20}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TabButton value="profile" label={t('navigation.profile') || 'Profile'} icon="account" />
        <TabButton value="membership" label={t('payments.title') || 'Payments'} icon="cash" />
        <TabButton value="attendance" label={t('attendance.title') || 'Attendance'} icon="calendar-check" />
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'membership' && renderMembershipTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}
    </ScrollView>

    {/* Fixed Chat Button */}
    {member.userId && (
      <TouchableOpacity style={styles.chatFab} onPress={handleStartChat}>
        <MaterialCommunityIcons name="message-text" size={24} color="#fff" />
      </TouchableOpacity>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
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
  backButton: {
    marginTop: Spacing.lg,
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
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
  reminderButtons: {
    gap: Spacing.xs,
  },
  reminderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  editButton: {
    padding: Spacing.xs,
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
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
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
  // Action button
  actionButton: {
    marginTop: Spacing.md,
  },
});
