import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
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
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  checkinTime?: string;
  checkinMethod?: 'QR' | 'MANUAL';
}

interface AttendanceData {
  attendance: AttendanceRecord[];
  attendanceRate: number;
}

export default function MemberAttendance() {
  const { t } = useLanguage();
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await api.get('/attendance/me');
      setAttendanceData(response.data.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData(null);
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
        return { color: Colors.success, label: t('status.present'), icon: 'check-circle' as const };
      case 'LATE':
        return { color: Colors.warning, label: t('status.late'), icon: 'clock' as const };
      case 'ABSENT':
        return { color: Colors.error, label: t('status.absent'), icon: 'close-circle' as const };
      case 'EXCUSED':
        return { color: Colors.info, label: t('status.excused'), icon: 'account-check' as const };
      default:
        return { color: Colors.textSecondary, label: t('status.unknown') || 'Unknown', icon: 'help-circle' as const };
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

  // Calculate stats from attendance data
  const calculateStats = () => {
    if (!attendanceData?.attendance) {
      return { total: 0, present: 0, late: 0, absent: 0 };
    }
    const records = attendanceData.attendance;
    return {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
    };
  };

  const stats = calculateStats();

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => {
    const statusInfo = getStatusInfo(item.status);
    return (
      <Card style={styles.recordCard}>
        <Card.Content style={styles.recordContent}>
          <View style={styles.recordInfo}>
            <Text style={styles.eventTitle}>{item.eventId?.title || t('events.event')}</Text>
            <View style={styles.eventMeta}>
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSecondary} />
              <Text style={styles.eventMetaText}>
                {item.eventId?.startTime ? formatDate(item.eventId.startTime) : '--'}
              </Text>
            </View>
            {item.checkinTime && (
              <View style={styles.eventMeta}>
                <MaterialCommunityIcons name="qrcode-scan" size={14} color={Colors.textSecondary} />
                <Text style={styles.eventMetaText}>
                  {t('attendance.checkedIn')}: {formatTime(item.checkinTime)}
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
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('attendance.loading') || 'Loading attendance...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.rateContainer}>
            <Text style={styles.rateLabel}>{t('attendance.rate')}:</Text>
            <Text
              style={[
                styles.rateValue,
                {
                  color:
                    (attendanceData?.attendanceRate || 0) >= 80
                      ? Colors.success
                      : (attendanceData?.attendanceRate || 0) >= 60
                      ? Colors.warning
                      : Colors.error,
                },
              ]}
            >
              {Math.round(attendanceData?.attendanceRate || 0)}%
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>{t('status.present')}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock" size={20} color={Colors.warning} />
              <Text style={styles.statNumber}>{stats.late}</Text>
              <Text style={styles.statLabel}>{t('status.late')}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>{t('status.absent')}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.textSecondary} />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('common.total')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Records List */}
      <Text style={styles.sectionTitle}>{t('attendance.recentEvents') || 'Recent Events'}</Text>
      <FlatList
        data={attendanceData?.attendance || []}
        renderItem={renderAttendanceRecord}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('attendance.noRecords') || 'No attendance records yet'}</Text>
              <Text style={styles.emptySubtext}>
                {t('attendance.historyAppearHere') || 'Your attendance history will appear here'}
              </Text>
            </Card.Content>
          </Card>
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
  statsCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  rateLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  rateValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
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
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
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
