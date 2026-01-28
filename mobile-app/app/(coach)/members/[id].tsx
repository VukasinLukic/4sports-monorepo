import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, FlatList } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator, Divider, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useMember, useMemberAttendance, useMemberPayments } from '@/hooks/useMembers';
import { PaymentStatus, Attendance, Payment } from '@/types';

type TabValue = 'profile' | 'membership' | 'attendance';

export default function MemberDetailsScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('profile');

  const { data: member, isLoading, refetch: refetchMember } = useMember(memberId);
  const { data: attendance = [], refetch: refetchAttendance } = useMemberAttendance(memberId);
  const { data: payments = [], refetch: refetchPayments } = useMemberPayments(memberId);

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

  const getPaymentStatusInfo = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return { color: Colors.success, label: 'Paid', icon: 'check-circle' as const };
      case PaymentStatus.UNPAID:
        return { color: Colors.error, label: 'Unpaid', icon: 'alert-circle' as const };
      case PaymentStatus.PARTIAL:
        return { color: Colors.warning, label: 'Partial', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const getMedicalStatusInfo = (status: string) => {
    switch (status) {
      case 'VALID':
        return { color: Colors.success, label: 'Valid', icon: 'check-circle' as const };
      case 'EXPIRED':
        return { color: Colors.error, label: 'Expired', icon: 'alert-circle' as const };
      case 'EXPIRING_SOON':
        return { color: Colors.warning, label: 'Expiring Soon', icon: 'clock' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const getInitials = (name?: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter((a: Attendance) => a.status === 'PRESENT').length;
    return Math.round((present / attendance.length) * 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading member...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>Member Not Found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    );
  }

  const paymentInfo = getPaymentStatusInfo(member.paymentStatus);
  const medicalInfo = getMedicalStatusInfo(member.medicalCheckStatus);
  const attendanceRate = calculateAttendanceRate();

  const getAttendanceStatusInfo = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { color: Colors.success, icon: 'check-circle' as const };
      case 'ABSENT':
        return { color: Colors.error, icon: 'close-circle' as const };
      case 'LATE':
        return { color: Colors.warning, icon: 'clock' as const };
      case 'EXCUSED':
        return { color: Colors.info, icon: 'account-check' as const };
      default:
        return { color: Colors.textSecondary, icon: 'help-circle' as const };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return Colors.success;
      case 'PENDING':
        return Colors.warning;
      case 'OVERDUE':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const calculatePaymentSummary = () => {
    const total = payments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
    const paidCount = payments.filter((p: Payment) => p.status === 'PAID').length;
    return { total, paidCount };
  };

  const paymentSummary = calculatePaymentSummary();

  // Render Profile Tab Content
  const renderProfileTab = () => (
    <>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{attendanceRate}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={Colors.info} />
            <Text style={styles.statNumber}>{attendance.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="cash" size={24} color={Colors.warning} />
            <Text style={styles.statNumber}>{payments.length}</Text>
            <Text style={styles.statLabel}>Payments</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Member Details */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Member Information</Text>
          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="ruler" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Height:</Text>
            <Text style={styles.detailValue}>{member.height ? `${member.height} cm` : 'Not set'}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="scale" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{member.weight ? `${member.weight} kg` : 'Not set'}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="soccer" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Position:</Text>
            <Text style={styles.detailValue}>{member.position || 'Not set'}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Medical Expiry:</Text>
            <Text style={[styles.detailValue, { color: medicalInfo.color }]}>
              {formatDate(member.medicalCheckExpiryDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="cash-check" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Last Payment:</Text>
            <Text style={styles.detailValue}>{formatDate(member.lastPaymentDate)}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Text style={styles.actionTitle}>Quick Actions</Text>

      <View style={styles.actionRow}>
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
          Record Payment
        </Button>

        <Button
          mode="contained"
          icon="medical-bag"
          onPress={() => router.push({
            pathname: '/(coach)/medical/record',
            params: { memberId: member._id, memberName: member.fullName }
          })}
          style={styles.actionButton}
          buttonColor={Colors.info}
        >
          Record Medical
        </Button>
      </View>
    </>
  );

  // Render Membership Tab Content
  const renderMembershipTab = () => (
    <>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{payments.length}</Text>
              <Text style={styles.summaryLabel}>Total Payments</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.success }]}>
                {paymentSummary.paidCount}
              </Text>
              <Text style={styles.summaryLabel}>Paid</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.primary }]}>
                {paymentSummary.total.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Total Amount</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment History */}
      <Text style={styles.sectionHeader}>Payment History</Text>
      {payments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="cash-remove" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Payment Records</Text>
            <Text style={styles.emptySubtitle}>Payment history will appear here</Text>
          </Card.Content>
        </Card>
      ) : (
        payments.map((payment: Payment) => (
          <Card key={payment._id} style={styles.historyCard}>
            <Card.Content style={styles.historyContent}>
              <View style={styles.historyLeft}>
                <View style={[styles.historyIcon, { backgroundColor: Colors.success + '20' }]}>
                  <MaterialCommunityIcons name="cash" size={20} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.historyTitle}>
                    {payment.amount} {payment.currency || 'RSD'}
                  </Text>
                  <Text style={styles.historySubtitle}>
                    {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                  </Text>
                  {payment.note && (
                    <Text style={styles.historyNote}>{payment.note}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(payment.status || 'PAID') + '20' }]}>
                <Text style={[styles.statusText, { color: getPaymentStatusColor(payment.status || 'PAID') }]}>
                  {payment.status || 'PAID'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      {/* Record Payment Button */}
      <Button
        mode="contained"
        icon="cash-plus"
        onPress={() => router.push({
          pathname: '/(coach)/payments/record',
          params: { memberId: member._id, memberName: member.fullName }
        })}
        style={styles.addButton}
        buttonColor={Colors.success}
      >
        Record New Payment
      </Button>
    </>
  );

  // Render Attendance Tab Content
  const renderAttendanceTab = () => {
    const presentCount = attendance.filter((a: Attendance) => a.status === 'PRESENT').length;
    const absentCount = attendance.filter((a: Attendance) => a.status === 'ABSENT').length;
    const lateCount = attendance.filter((a: Attendance) => a.status === 'LATE').length;
    const excusedCount = attendance.filter((a: Attendance) => a.status === 'EXCUSED').length;

    return (
      <>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.attendanceSummary}>
              <View style={styles.attendanceRate}>
                <Text style={styles.rateNumber}>{attendanceRate}%</Text>
                <Text style={styles.rateLabel}>Attendance Rate</Text>
              </View>
              <View style={styles.attendanceBreakdown}>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.breakdownLabel}>Present</Text>
                  <Text style={styles.breakdownValue}>{presentCount}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: Colors.error }]} />
                  <Text style={styles.breakdownLabel}>Absent</Text>
                  <Text style={styles.breakdownValue}>{absentCount}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.breakdownLabel}>Late</Text>
                  <Text style={styles.breakdownValue}>{lateCount}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: Colors.info }]} />
                  <Text style={styles.breakdownLabel}>Excused</Text>
                  <Text style={styles.breakdownValue}>{excusedCount}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Attendance History */}
        <Text style={styles.sectionHeader}>Attendance History</Text>
        {attendance.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptySubtitle}>Attendance history will appear here</Text>
            </Card.Content>
          </Card>
        ) : (
          attendance.map((record: Attendance) => {
            const statusInfo = getAttendanceStatusInfo(record.status);
            return (
              <Card key={record._id} style={styles.historyCard}>
                <Card.Content style={styles.historyContent}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.historyIcon, { backgroundColor: statusInfo.color + '20' }]}>
                      <MaterialCommunityIcons name={statusInfo.icon} size={20} color={statusInfo.color} />
                    </View>
                    <View>
                      <Text style={styles.historyTitle}>
                        {new Date(record.markedAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.historySubtitle}>
                        Marked at {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {record.status}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
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
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Profile Header - Always visible */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={getInitials(member.fullName)}
            style={styles.avatar}
          />
          <Text style={styles.memberName}>{member.fullName}</Text>
          <Text style={styles.memberMeta}>
            Age: {member.age} • Born: {formatDate(member.dateOfBirth)}
          </Text>

          {/* Status Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: paymentInfo.color + '20' }]}>
              <MaterialCommunityIcons
                name={paymentInfo.icon}
                size={14}
                color={paymentInfo.color}
              />
              <Text style={[styles.badgeText, { color: paymentInfo.color }]}>
                {paymentInfo.label}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: medicalInfo.color + '20' }]}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={14}
                color={medicalInfo.color}
              />
              <Text style={[styles.badgeText, { color: medicalInfo.color }]}>
                {medicalInfo.label}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        buttons={[
          { value: 'profile', label: 'Profile', icon: 'account' },
          { value: 'membership', label: 'Membership', icon: 'cash' },
          { value: 'attendance', label: 'Attendance', icon: 'calendar-check' },
        ]}
        style={styles.tabs}
      />

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
    padding: Spacing.xl,
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  memberMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabs: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statNumber: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
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
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  // Summary Card Styles
  summaryCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  // Attendance Summary Styles
  attendanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  attendanceRate: {
    alignItems: 'center',
    paddingRight: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  rateNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  rateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  attendanceBreakdown: {
    flex: 1,
    gap: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  // History Card Styles
  historyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  historySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  // Empty State Styles
  emptyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  addButton: {
    marginTop: Spacing.md,
  },
  recentCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  attendanceDate: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  attendanceStatus: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  paymentDate: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  paymentAmount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  paymentMethod: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
