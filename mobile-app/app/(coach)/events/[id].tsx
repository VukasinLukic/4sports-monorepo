import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, ActivityIndicator, Avatar, IconButton, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Event, EventParticipant, EventParticipantsStats } from '@/types';

type TabType = 'overview' | 'participants';

// Helper function to get event type color for any type string
const getEventTypeColorFromString = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return Colors.eventTraining;
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ')) {
    return Colors.eventCompetition;
  }
  if (upperType === 'OTHER') {
    return Colors.eventMeeting;
  }
  return Colors.primary;
};

export default function EventDetailScreen() {
  const { t, language } = useLanguage();
  const dateLocale = language === 'sr' ? 'sr-RS' : 'en-US';
  const insets = useSafeAreaInsets();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [stats, setStats] = useState<EventParticipantsStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tab === 'participants' ? 'participants' : 'overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'this' | 'future' | 'all'>('this');

  const fetchEvent = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert(t('common.error'), t('errors.loadEventFailed'));
    }
  }, [id, t]);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}/participants`);
      setParticipants(response.data.data.participants || []);
      setStats(response.data.data.stats || null);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchEvent(), fetchParticipants()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchEvent, fetchParticipants]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      fetchParticipants();
    }, [fetchParticipants])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getGroupName = () => {
    if (!event?.groupId) return t('common.unknown');
    if (typeof event.groupId === 'string') return t('events.group');
    return event.groupId.name;
  };

  const handleShowQRCode = () => {
    // Generate QR code in the same format as attendance screen
    const qrCodeValue = JSON.stringify({
      type: 'EVENT_ATTENDANCE',
      eventId: id,
      clubId: event?.clubId,
    });

    router.push({
      pathname: '/(coach)/events/qr',
      params: { eventId: id, eventTitle: event?.title, qrCode: qrCodeValue },
    });
  };

  const handleSendReminder = async () => {
    try {
      // Send reminder to all participants who haven't confirmed
      Alert.alert(t('common.success'), t('events.reminderSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('events.reminderFailed'));
    }
  };

  const handleEditEvent = () => {
    router.push({ pathname: '/(coach)/events/edit', params: { id } });
  };

  const handleCancelEvent = async () => {
    Alert.alert(
      t('events.cancelEvent'),
      t('events.cancelEventConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/events/${id}`, { status: 'CANCELLED' });
              Alert.alert(t('common.success'), t('events.eventCancelled'));
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), t('events.cancelFailed'));
            }
          },
        },
      ]
    );
  };

  const isRecurringSeries = !!(event?.isRecurring || event?.parentEventId);

  const handleDeleteEvent = () => {
    setDeleteMode('this');
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      if (isRecurringSeries) {
        await api.delete(`/events/${id}`, { params: { deleteMode } });
      } else {
        await api.delete(`/events/${id}`);
      }
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), t('events.deleteFailed'));
    }
  };

  const handleToggleAttendance = async (participant: EventParticipant, markPresent: boolean) => {
    try {
      await api.post('/attendance/mark', {
        eventId: id,
        memberId: participant.memberId._id,
        status: markPresent ? 'PRESENT' : 'ABSENT',
      });
      fetchParticipants();
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert(t('common.error'), t('attendance.markFailed'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('events.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
          <MaterialCommunityIcons name="calendar-remove" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{t('events.notFound')}</Text>
        </View>
      </View>
    );
  }

  const startFormatted = formatDateTime(event.startTime);
  const endFormatted = formatDateTime(event.endTime);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={[styles.typeBadge, { backgroundColor: getEventTypeColorFromString(event.type) }]}>
          <Text style={styles.typeBadgeText}>{event.type}</Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon="pencil"
            size={22}
            iconColor={Colors.text}
            onPress={handleEditEvent}
          />
          <IconButton
            icon="delete-outline"
            size={22}
            iconColor={Colors.error}
            onPress={handleDeleteEvent}
          />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{event.title}</Text>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            {t('events.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'participants' && styles.tabButtonActive]}
          onPress={() => setActiveTab('participants')}
        >
          <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
            {t('events.participants')} ({stats?.total || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Date & Time Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('events.date')}</Text>
                    <Text style={styles.infoValue}>{startFormatted.date}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('events.time')}</Text>
                    <Text style={styles.infoValue}>{startFormatted.time} - {endFormatted.time}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Location */}
            {event.location && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={24} color={Colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>{t('events.location')}</Text>
                      <Text style={styles.infoValue}>{event.location}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Group */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('events.group')}</Text>
                    <Text style={styles.infoValue}>{getGroupName()}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Description */}
            {event.description && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>{t('events.description')}</Text>
                  <Text style={styles.description}>{event.description}</Text>
                </Card.Content>
              </Card>
            )}

            {/* Participants Summary */}
            {stats && (
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/(coach)/events/rsvp',
                  params: { eventId: id, eventTitle: event.title },
                })}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.participantsSummaryHeader}>
                      <Text style={styles.sectionTitle}>{t('events.participants')}</Text>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('rsvp.total')}</Text>
                      <Text style={styles.summaryValue}>{stats.total}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryBadgeGreen}>
                        <Text style={styles.summaryBadgeTextGreen}>{t('rsvp.attending')}</Text>
                      </View>
                      <Text style={[styles.summaryValue, { color: Colors.success }]}>{stats.confirmed}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryBadgeRed}>
                        <Text style={styles.summaryBadgeTextRed}>{t('rsvp.notAttending')}</Text>
                      </View>
                      <Text style={[styles.summaryValue, { color: Colors.error }]}>{stats.declined}</Text>
                    </View>
                    <Text style={styles.viewDetailsText}>{t('rsvp.viewDetails')}</Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Participants List */}
            {participants.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>{t('events.noParticipants')}</Text>
                </Card.Content>
              </Card>
            ) : (
              participants.filter(p => p.memberId && (typeof p.memberId === 'object' ? p.memberId.fullName : true)).map((participant) => {
                const isPresent = participant.status === 'PRESENT' || participant.status === 'LATE';

                return (
                  <Card key={participant._id} style={[styles.participantCard, isPresent ? styles.presentCard : styles.absentCard]}>
                    <Card.Content style={styles.participantContent}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{typeof participant.memberId === 'object' ? participant.memberId.fullName : t('common.unknown')}</Text>
                        <View style={styles.attendanceRow}>
                          <Text style={[styles.attendanceText, { color: isPresent ? Colors.success : Colors.error }]}>
                            {isPresent ? t('attendance.arrived') : t('attendance.notArrived')}
                          </Text>
                          {participant.checkinMethod === 'QR' && (
                            <MaterialCommunityIcons name="qrcode" size={14} color={Colors.textSecondary} />
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.checkbox, isPresent && styles.checkboxChecked]}
                        onPress={() => handleToggleAttendance(participant, !isPresent)}
                      >
                        {isPresent && (
                          <MaterialCommunityIcons name="check" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Floating QR Button */}
      {activeTab === 'overview' && (
        <FAB
          icon="qrcode"
          style={[styles.qrFab, { bottom: (insets.bottom || 10) + 78 }]}
          color="#fff"
          onPress={handleShowQRCode}
        />
      )}

      {/* Delete Event Dialog */}
      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteDialog(false)}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteDialog(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>
              {isRecurringSeries ? t('events.deleteRecurringTitle') : t('events.deleteEvent')}
            </Text>
            <Text style={styles.dialogDescription}>
              {isRecurringSeries ? t('events.deleteRecurringDesc') : t('events.deleteEventConfirm')}
            </Text>

            {isRecurringSeries && (['this', 'future', 'all'] as const).map((mode) => {
              const labels = {
                this: t('events.deleteThis'),
                future: t('events.deleteFuture'),
                all: t('events.deleteAll'),
              };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.radioOption, deleteMode === mode && styles.radioOptionSelected]}
                  onPress={() => setDeleteMode(mode)}
                >
                  <View style={[styles.radioCircle, deleteMode === mode && styles.radioCircleSelected]}>
                    {deleteMode === mode && <View style={styles.radioCircleInner} />}
                  </View>
                  <Text style={[styles.radioLabel, deleteMode === mode && styles.radioLabelSelected]}>
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                onPress={() => setShowDeleteDialog(false)}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.dialogDeleteText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.lg },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },
  errorText: { fontSize: FontSize.lg, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  backButton: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  typeBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  typeBadgeText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },

  title: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.text, paddingHorizontal: Spacing.md, marginTop: Spacing.sm },

  tabContainer: { flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 4 },
  tabButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  tabButtonActive: { backgroundColor: Colors.success },
  tabText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  content: { padding: Spacing.md, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoContent: { marginLeft: Spacing.md, flex: 1 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  participantsSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  summaryLabel: { fontSize: FontSize.md, color: Colors.text },
  summaryValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  summaryBadgeGreen: { backgroundColor: Colors.success + '30', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  summaryBadgeRed: { backgroundColor: Colors.error + '30', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  summaryBadgeTextGreen: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600' },
  summaryBadgeTextRed: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
  viewDetailsText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  emptyCard: { backgroundColor: Colors.surface },
  emptyContent: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm },

  participantCard: { marginBottom: Spacing.sm, borderRadius: BorderRadius.md },
  presentCard: { backgroundColor: Colors.success + '15' },
  absentCard: { backgroundColor: Colors.error + '15' },
  participantContent: { flexDirection: 'row', alignItems: 'center' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  attendanceText: { fontSize: FontSize.sm, fontWeight: '500' },

  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },

  qrFab: { position: 'absolute', right: Spacing.lg, backgroundColor: Colors.primary },

  // Delete recurring dialog
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dialogContainer: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '85%', maxWidth: 360 },
  dialogTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.xs },
  dialogDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, borderWidth: 1.5, borderColor: 'transparent' },
  radioOptionSelected: { borderColor: Colors.error, backgroundColor: Colors.error + '15' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textSecondary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  radioCircleSelected: { borderColor: Colors.error },
  radioCircleInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.error },
  radioLabel: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  radioLabelSelected: { color: Colors.error, fontWeight: '600' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Spacing.lg, gap: Spacing.sm },
  dialogCancelButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: Colors.border },
  dialogCancelText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  dialogDeleteButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, backgroundColor: Colors.error },
  dialogDeleteText: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
});
