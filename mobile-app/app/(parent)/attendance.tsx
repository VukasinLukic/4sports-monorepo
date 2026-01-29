import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';

interface AttendanceRecord {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    type: string;
    startTime: string;
    location?: string;
  };
  memberId: {
    _id: string;
    fullName: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  checkinTime?: string;
  checkinMethod?: 'QR' | 'MANUAL';
}

interface ChildAttendance {
  childId: string;
  childName: string;
  records: AttendanceRecord[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
}

export default function ParentAttendance() {
  const [childrenAttendance, setChildrenAttendance] = useState<ChildAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      // First get parent's children
      const childrenResponse = await api.get('/members/my-children');
      const children = childrenResponse.data.data || [];

      // Then fetch attendance for each child
      const attendanceData: ChildAttendance[] = [];

      for (const child of children) {
        try {
          const attendanceResponse = await api.get(`/attendance/member/${child._id}`);
          const data = attendanceResponse.data.data;
          const records = data?.attendance || [];

          // Calculate stats
          const total = records.length;
          const present = records.filter((r: any) => r.status === 'PRESENT').length;
          const late = records.filter((r: any) => r.status === 'LATE').length;
          const absent = records.filter((r: any) => r.status === 'ABSENT').length;
          const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

          attendanceData.push({
            childId: child._id,
            childName: child.fullName,
            records: records.map((r: any) => ({
              ...r,
              memberId: { _id: child._id, fullName: child.fullName },
            })),
            stats: { total, present, absent, late, rate },
          });
        } catch {
          attendanceData.push({
            childId: child._id,
            childName: child.fullName,
            records: [],
            stats: { total: 0, present: 0, absent: 0, late: 0, rate: 0 },
          });
        }
      }

      setChildrenAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setChildrenAttendance([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAttendance();
    }, [fetchAttendance])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAttendance();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { color: Colors.success, label: 'Present', icon: 'check-circle' as const };
      case 'LATE':
        return { color: Colors.warning, label: 'Late', icon: 'clock' as const };
      case 'ABSENT':
        return { color: Colors.error, label: 'Absent', icon: 'close-circle' as const };
      case 'EXCUSED':
        return { color: Colors.info, label: 'Excused', icon: 'account-check' as const };
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: 'help-circle' as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderChildSection = ({ item }: { item: ChildAttendance }) => {
    const getInitials = (name: string) =>
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
      <View style={styles.childSection}>
        {/* Child Header with Stats */}
        <Card style={styles.childCard}>
          <Card.Content>
            <View style={styles.childHeader}>
              <Avatar.Text size={48} label={getInitials(item.childName)} style={styles.avatar} />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{item.childName}</Text>
                <View style={styles.rateContainer}>
                  <Text style={styles.rateLabel}>Attendance Rate:</Text>
                  <Text
                    style={[
                      styles.rateValue,
                      { color: item.stats.rate >= 80 ? Colors.success : item.stats.rate >= 60 ? Colors.warning : Colors.error },
                    ]}
                  >
                    {item.stats.rate}%
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.statNumber}>{item.stats.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock" size={20} color={Colors.warning} />
                <Text style={styles.statNumber}>{item.stats.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="close-circle" size={20} color={Colors.error} />
                <Text style={styles.statNumber}>{item.stats.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.textSecondary} />
                <Text style={styles.statNumber}>{item.stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Records */}
        {item.records.length > 0 ? (
          <View style={styles.recordsContainer}>
            <Text style={styles.recordsTitle}>Recent Events</Text>
            {item.records.slice(0, 5).map((record) => {
              const statusInfo = getStatusInfo(record.status);
              return (
                <Card key={record._id} style={styles.recordCard}>
                  <Card.Content style={styles.recordContent}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.eventTitle}>{record.eventId?.title || 'Event'}</Text>
                      <View style={styles.eventMeta}>
                        <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSecondary} />
                        <Text style={styles.eventMetaText}>
                          {record.eventId?.startTime ? formatDate(record.eventId.startTime) : '--'}
                        </Text>
                      </View>
                      {record.checkinTime && (
                        <View style={styles.eventMeta}>
                          <MaterialCommunityIcons name="qrcode-scan" size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventMetaText}>
                            Checked in: {formatTime(record.checkinTime)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: statusInfo.color + '20' }]}
                      textStyle={[styles.statusChipText, { color: statusInfo.color }]}
                      icon={() => (
                        <MaterialCommunityIcons name={statusInfo.icon} size={14} color={statusInfo.color} />
                      )}
                    >
                      {statusInfo.label}
                    </Chip>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noRecordsText}>No attendance records yet</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={childrenAttendance}
      renderItem={renderChildSection}
      keyExtractor={(item) => item.childId}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
      ListEmptyComponent={
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No children found</Text>
            <Text style={styles.emptySubtext}>
              Your children's attendance will appear here once they are registered
            </Text>
          </Card.Content>
        </Card>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
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
  childSection: {
    marginBottom: Spacing.lg,
  },
  childCard: {
    backgroundColor: Colors.surface,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  childInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  childName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  rateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rateValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginLeft: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  recordsContainer: {
    marginTop: Spacing.md,
  },
  recordsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  eventMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  noRecordsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
