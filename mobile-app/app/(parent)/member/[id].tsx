import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import api from '@/services/api';
import { Member, Attendance, PaymentStatus } from '@/types';

interface MemberStats {
  attendanceRate: number;
  totalSessions: number;
  presentSessions: number;
}

export default function MemberProfileScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch member details
      const memberResponse = await api.get(`/members/${memberId}`);
      setMember(memberResponse.data.data);

      // Fetch attendance stats
      try {
        const statsResponse = await api.get(`/attendance/member/${memberId}/stats`);
        setStats(statsResponse.data.data);
      } catch {
        // Stats endpoint might not exist yet
        setStats({ attendanceRate: 0, totalSessions: 0, presentSessions: 0 });
      }

      // Fetch recent attendance
      try {
        const attendanceResponse = await api.get(`/attendance/member/${memberId}`, {
          params: { limit: 10 }
        });
        setRecentAttendance(attendanceResponse.data.data || []);
      } catch {
        setRecentAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      Alert.alert('Error', 'Failed to load member profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return Colors.success;
      case PaymentStatus.UNPAID:
        return Colors.error;
      case PaymentStatus.PARTIAL:
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const getMedicalStatusColor = (status: string) => {
    switch (status) {
      case 'VALID':
        return Colors.success;
      case 'EXPIRED':
        return Colors.error;
      case 'EXPIRING_SOON':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="account-off" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorText}>Member not found</Text>
      </View>
    );
  }

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
      <View style={styles.profileHeader}>
        <Avatar.Text
          size={80}
          label={member.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
          style={styles.avatar}
        />
        <Text style={styles.memberName}>{member.fullName}</Text>
        <Text style={styles.memberAge}>Age: {member.age}</Text>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrSection}>
        <QRCodeDisplay
          qrCode={member.qrCode}
          memberName={member.fullName}
          size={180}
          showName={false}
        />
      </View>

      {/* Status Cards */}
      <View style={styles.statsGrid}>
        {/* Payment Status */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <MaterialCommunityIcons
              name="cash"
              size={28}
              color={getPaymentStatusColor(member.paymentStatus)}
            />
            <Text style={styles.statusLabel}>Payment</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getPaymentStatusColor(member.paymentStatus) + '20' }
              ]}
              textStyle={[
                styles.statusChipText,
                { color: getPaymentStatusColor(member.paymentStatus) }
              ]}
            >
              {member.paymentStatus}
            </Chip>
          </Card.Content>
        </Card>

        {/* Medical Status */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <MaterialCommunityIcons
              name="medical-bag"
              size={28}
              color={getMedicalStatusColor(member.medicalCheckStatus)}
            />
            <Text style={styles.statusLabel}>Medical</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getMedicalStatusColor(member.medicalCheckStatus) + '20' }
              ]}
              textStyle={[
                styles.statusChipText,
                { color: getMedicalStatusColor(member.medicalCheckStatus) }
              ]}
            >
              {member.medicalCheckStatus.replace('_', ' ')}
            </Chip>
          </Card.Content>
        </Card>

        {/* Attendance Rate */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <MaterialCommunityIcons
              name="chart-line"
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.statusLabel}>Attendance</Text>
            <Text style={styles.attendanceRate}>
              {stats?.attendanceRate ?? 0}%
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Member Details */}
      {(member.height || member.weight || member.position) && (
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              {member.height && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Height</Text>
                  <Text style={styles.detailValue}>{member.height} cm</Text>
                </View>
              )}
              {member.weight && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{member.weight} kg</Text>
                </View>
              )}
              {member.position && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Position</Text>
                  <Text style={styles.detailValue}>{member.position}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Medical Check Info */}
      {member.medicalCheckExpiryDate && (
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.textSecondary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Medical Check Expires</Text>
              <Text style={styles.infoValue}>
                {new Date(member.medicalCheckExpiryDate).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Last Payment Info */}
      {member.lastPaymentDate && (
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <MaterialCommunityIcons name="cash-check" size={24} color={Colors.textSecondary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Last Payment</Text>
              <Text style={styles.infoValue}>
                {new Date(member.lastPaymentDate).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Recent Attendance */}
      <Text style={styles.sectionTitle}>Recent Attendance</Text>
      {recentAttendance.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="calendar-check-outline" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No attendance records yet</Text>
          </Card.Content>
        </Card>
      ) : (
        recentAttendance.map((record) => (
          <Card key={record._id} style={styles.attendanceCard}>
            <Card.Content style={styles.attendanceContent}>
              <MaterialCommunityIcons
                name={record.status === 'PRESENT' ? 'check-circle' : 'close-circle'}
                size={24}
                color={record.status === 'PRESENT' ? Colors.success : Colors.error}
              />
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceDate}>
                  {new Date(record.markedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.attendanceTime}>
                  {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Chip
                style={[
                  styles.attendanceChip,
                  { backgroundColor: record.status === 'PRESENT' ? Colors.success + '20' : Colors.error + '20' }
                ]}
                textStyle={{
                  color: record.status === 'PRESENT' ? Colors.success : Colors.error,
                  fontSize: FontSize.xs,
                }}
              >
                {record.status}
              </Chip>
            </Card.Content>
          </Card>
        ))
      )}
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
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.sm,
  },
  memberName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  memberAge: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  qrSection: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statusLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  attendanceRate: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailItem: {
    minWidth: 80,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  attendanceCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  attendanceDate: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  attendanceTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  attendanceChip: {
    height: 24,
  },
});
