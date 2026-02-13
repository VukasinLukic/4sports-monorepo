import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { EventParticipant } from '@/types';

type FilterType = 'all' | 'attending' | 'notAttending';

export default function RsvpListScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId: string; eventTitle: string }>();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await api.get(`/events/${eventId}/participants`);
      setParticipants(response.data.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const filteredParticipants = participants.filter(p => {
    // Filter by search
    if (search && !p.memberId.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Filter by RSVP status
    if (filter === 'attending') return p.rsvpStatus === 'CONFIRMED';
    if (filter === 'notAttending') return p.rsvpStatus === 'DECLINED';
    return true;
  });

  const getRsvpLabel = (status: string) => {
    if (status === 'CONFIRMED') return t('rsvp.confirmedShort');
    if (status === 'DECLINED') return t('rsvp.declinedShort');
    return t('rsvp.notResponded');
  };

  const getRsvpColor = (status: string) => {
    if (status === 'CONFIRMED') return Colors.success;
    if (status === 'DECLINED') return Colors.error;
    return Colors.textSecondary;
  };

  const getRsvpIcon = (status: string): string => {
    if (status === 'CONFIRMED') return 'check';
    if (status === 'DECLINED') return 'close';
    return 'help-circle-outline';
  };

  const renderParticipant = ({ item }: { item: EventParticipant }) => {
    const color = getRsvpColor(item.rsvpStatus);
    return (
      <Card style={styles.participantCard}>
        <Card.Content style={styles.participantContent}>
          {item.memberId.profileImage ? (
            <Avatar.Image size={44} source={{ uri: item.memberId.profileImage }} />
          ) : (
            <Avatar.Text
              size={44}
              label={item.memberId.fullName?.slice(0, 2).toUpperCase() || '??'}
              style={{ backgroundColor: Colors.primary }}
            />
          )}
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.memberId.fullName}</Text>
            <View style={styles.rsvpRow}>
              <MaterialCommunityIcons name={getRsvpIcon(item.rsvpStatus)} size={14} color={color} />
              <Text style={[styles.rsvpText, { color }]}>{getRsvpLabel(item.rsvpStatus)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('rsvp.confirmations')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('rsvp.searchMember')}
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Chip
          selected={filter === 'all'}
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          textStyle={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}
          onPress={() => setFilter('all')}
        >
          {t('rsvp.all')}
        </Chip>
        <Chip
          selected={filter === 'attending'}
          style={[styles.filterChip, filter === 'attending' && styles.filterChipAttending]}
          textStyle={[styles.filterChipText, filter === 'attending' && styles.filterChipTextActive]}
          onPress={() => setFilter('attending')}
        >
          {t('rsvp.attending')}
        </Chip>
        <Chip
          selected={filter === 'notAttending'}
          style={[styles.filterChip, filter === 'notAttending' && styles.filterChipNotAttending]}
          textStyle={[styles.filterChipText, filter === 'notAttending' && styles.filterChipTextActive]}
          onPress={() => setFilter('notAttending')}
        >
          {t('rsvp.notAttending')}
        </Chip>
      </View>

      {/* List */}
      <FlatList
        data={filteredParticipants}
        keyExtractor={(item) => item._id}
        renderItem={renderParticipant}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('events.noParticipants')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, flex: 1 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, padding: 0 },

  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  filterChip: { backgroundColor: Colors.surface },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipAttending: { backgroundColor: Colors.success },
  filterChipNotAttending: { backgroundColor: Colors.error },
  filterChipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  filterChipTextActive: { color: '#fff' },

  listContent: { padding: Spacing.md },

  participantCard: { backgroundColor: Colors.surface, marginBottom: Spacing.sm, borderRadius: BorderRadius.md },
  participantContent: { flexDirection: 'row', alignItems: 'center' },
  participantInfo: { flex: 1, marginLeft: Spacing.md },
  participantName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  rsvpText: { fontSize: FontSize.sm, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm },
});
