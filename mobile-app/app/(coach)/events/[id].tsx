import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, ActivityIndicator, Avatar, IconButton, Menu, FAB } from 'react-native-paper';
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
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [stats, setStats] = useState<EventParticipantsStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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
      date: date.toLocaleDateString('sr-RS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getGroupName = () => {
    if (!event?.groupId) return 'Nepoznato';
    if (typeof event.groupId === 'string') return 'Grupa';
    return event.groupId.name;
  };

  const handleShowQRCode = () => {
    router.push({
      pathname: '/(coach)/events/qr',
      params: { eventId: id, eventTitle: event?.title, qrCode: event?.qrCode },
    });
  };

  const handleSendReminder = async () => {
    try {
      // Send reminder to all participants who haven't confirmed
      Alert.alert(t('common.success'), 'Podsetnik je poslat svim učesnicima');
    } catch (error) {
      Alert.alert(t('common.error'), 'Slanje podsetnika nije uspelo');
    }
  };

  const handleEditEvent = () => {
    setMenuVisible(false);
    router.push({ pathname: '/(coach)/events/edit', params: { id } });
  };

  const handleCancelEvent = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Otkaži događaj',
      'Da li ste sigurni da želite da otkažete ovaj događaj?',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Da, otkaži',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/events/${id}`, { status: 'CANCELLED' });
              Alert.alert(t('common.success'), 'Događaj je otkazan');
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), 'Otkazivanje događaja nije uspelo');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Obriši događaj',
      'Da li ste sigurni da želite da obrišete ovaj događaj? Ova akcija se ne može poništiti.',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Da, obriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/events/${id}`);
              Alert.alert(t('common.success'), 'Događaj je obrisan');
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), 'Brisanje događaja nije uspelo');
            }
          },
        },
      ]
    );
  };

  const handleToggleConfirm = async (participant: EventParticipant, isConfirmed: boolean) => {
    try {
      await api.post('/attendance/mark', {
        eventId: id,
        memberId: participant.memberId._id,
        status: isConfirmed ? 'PRESENT' : 'ABSENT',
      });
      fetchParticipants();
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert(t('common.error'), 'Evidentiranje nije uspelo');
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
            icon="bell-ring-outline"
            size={24}
            iconColor={Colors.text}
            onPress={handleSendReminder}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                iconColor={Colors.text}
                onPress={() => setMenuVisible(true)}
              />
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item onPress={handleEditEvent} title="Izmeni" leadingIcon="pencil" />
            <Menu.Item onPress={handleCancelEvent} title="Otkaži" leadingIcon="close-circle-outline" />
            <Menu.Item onPress={handleDeleteEvent} title="Obriši" leadingIcon="delete" titleStyle={{ color: Colors.error }} />
          </Menu>
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
            Pregled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'participants' && styles.tabButtonActive]}
          onPress={() => setActiveTab('participants')}
        >
          <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
            Učesnici ({stats?.total || 0})
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
                    <Text style={styles.infoLabel}>Datum</Text>
                    <Text style={styles.infoValue}>{startFormatted.date}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vreme</Text>
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
                      <Text style={styles.infoLabel}>Lokacija</Text>
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
                    <Text style={styles.infoLabel}>Grupa</Text>
                    <Text style={styles.infoValue}>{getGroupName()}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Description */}
            {event.description && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Opis</Text>
                  <Text style={styles.description}>{event.description}</Text>
                </Card.Content>
              </Card>
            )}

            {/* Stats */}
            {stats && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Pregled prisustva</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.success }]}>{stats.confirmed}</Text>
                      <Text style={styles.statLabel}>Potvrđeno</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.pending}</Text>
                      <Text style={styles.statLabel}>Na čekanju</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.present}</Text>
                      <Text style={styles.statLabel}>Prisutno</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Participants List */}
            {participants.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>Nema učesnika</Text>
                </Card.Content>
              </Card>
            ) : (
              participants.map((participant) => {
                const isConfirmed = participant.rsvpStatus === 'CONFIRMED' || participant.status === 'PRESENT';

                return (
                  <Card key={participant._id} style={[styles.participantCard, isConfirmed ? styles.confirmedCard : styles.notConfirmedCard]}>
                    <Card.Content style={styles.participantContent}>
                      {participant.memberId.profileImage ? (
                        <Avatar.Image size={44} source={{ uri: participant.memberId.profileImage }} />
                      ) : (
                        <Avatar.Text
                          size={44}
                          label={participant.memberId.fullName?.slice(0, 2).toUpperCase() || '??'}
                          style={{ backgroundColor: Colors.primary }}
                        />
                      )}

                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{participant.memberId.fullName}</Text>
                        <View style={[styles.statusBadge, isConfirmed ? styles.confirmedBadge : styles.notConfirmedBadge]}>
                          <MaterialCommunityIcons
                            name={isConfirmed ? 'check' : 'close'}
                            size={14}
                            color={isConfirmed ? Colors.success : Colors.error}
                          />
                          <Text style={[styles.statusText, isConfirmed ? styles.confirmedText : styles.notConfirmedText]}>
                            {isConfirmed ? 'Potvrđeno' : 'Nije potvrđeno'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.participantActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, isConfirmed && styles.actionButtonActive]}
                          onPress={() => handleToggleConfirm(participant, true)}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={isConfirmed ? '#fff' : Colors.success}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, !isConfirmed && styles.actionButtonActiveRed]}
                          onPress={() => handleToggleConfirm(participant, false)}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={20}
                            color={!isConfirmed ? '#fff' : Colors.error}
                          />
                        </TouchableOpacity>
                      </View>
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
          style={styles.qrFab}
          color="#fff"
          onPress={handleShowQRCode}
        />
      )}
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
  menuContent: { backgroundColor: Colors.surface },

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

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSize.xl, fontWeight: 'bold' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  emptyCard: { backgroundColor: Colors.surface },
  emptyContent: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm },

  participantCard: { marginBottom: Spacing.sm, borderRadius: BorderRadius.md },
  confirmedCard: { backgroundColor: Colors.success + '15' },
  notConfirmedCard: { backgroundColor: Colors.error + '15' },
  participantContent: { flexDirection: 'row', alignItems: 'center' },
  participantInfo: { flex: 1, marginLeft: Spacing.md },
  participantName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, alignSelf: 'flex-start' },
  confirmedBadge: { backgroundColor: Colors.success + '20' },
  notConfirmedBadge: { backgroundColor: Colors.error + '20' },
  statusText: { fontSize: FontSize.xs, marginLeft: 4, fontWeight: '500' },
  confirmedText: { color: Colors.success },
  notConfirmedText: { color: Colors.error },

  participantActions: { flexDirection: 'row', gap: Spacing.xs },
  actionButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  actionButtonActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  actionButtonActiveRed: { backgroundColor: Colors.error, borderColor: Colors.error },

  qrFab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg + 16, backgroundColor: Colors.primary },
});
