import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useMember, useMemberAttendance, useMemberPayments } from '@/hooks/useMembers';
import { PaymentStatus, Attendance, Payment } from '@/types';

export default function MemberDetailsScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      {/* Profile Header */}
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

      {/* Recent Attendance */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            <Button
              mode="text"
              compact
              onPress={() => {/* TODO: Navigate to full attendance history */}}
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />

          {attendance.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No attendance records</Text>
            </View>
          ) : (
            attendance.slice(0, 5).map((record: Attendance) => (
              <View key={record._id} style={styles.attendanceRow}>
                <MaterialCommunityIcons
                  name={record.status === 'PRESENT' ? 'check-circle' : 'close-circle'}
                  size={20}
                  color={record.status === 'PRESENT' ? Colors.success : Colors.error}
                />
                <Text style={styles.attendanceDate}>
                  {new Date(record.markedAt).toLocaleDateString()}
                </Text>
                <Text style={[
                  styles.attendanceStatus,
                  { color: record.status === 'PRESENT' ? Colors.success : Colors.error }
                ]}>
                  {record.status}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Recent Payments */}
      <Card style={styles.recentCard}>
        <Card.Content>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <Button
              mode="text"
              compact
              onPress={() => {/* TODO: Navigate to full payment history */}}
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />

          {payments.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="cash-remove" size={32} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No payment records</Text>
            </View>
          ) : (
            payments.slice(0, 5).map((payment: Payment) => (
              <View key={payment._id} style={styles.paymentRow}>
                <MaterialCommunityIcons
                  name="cash"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.paymentDate}>
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </Text>
                <Text style={styles.paymentAmount}>
                  {payment.amount} {payment.currency}
                </Text>
                <Text style={styles.paymentMethod}>
                  {payment.paymentMethod.replace('_', ' ')}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
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
