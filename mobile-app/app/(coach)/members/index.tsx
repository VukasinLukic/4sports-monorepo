import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Searchbar, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useMembers } from '@/hooks/useMembers';
import MemberCard from '@/components/MemberCard';
import { Member, PaymentStatus } from '@/types';

type FilterType = 'all' | 'unpaid' | 'medical';

export default function CoachMembers() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: members = [], isLoading, refetch } = useMembers();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Filter members based on search and active filter
  const filteredMembers = useMemo(() => {
    let result = members;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member =>
        member.fullName?.toLowerCase().includes(query) ||
        member.firstName?.toLowerCase().includes(query) ||
        member.lastName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (activeFilter === 'unpaid') {
      result = result.filter(member => member.paymentStatus !== PaymentStatus.PAID);
    } else if (activeFilter === 'medical') {
      result = result.filter(member =>
        member.medicalCheckStatus === 'EXPIRED' || member.medicalCheckStatus === 'EXPIRING_SOON'
      );
    }

    return result;
  }, [members, searchQuery, activeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = members.length;
    const unpaid = members.filter(m => m.paymentStatus !== PaymentStatus.PAID).length;
    const medicalIssues = members.filter(m =>
      m.medicalCheckStatus === 'EXPIRED' || m.medicalCheckStatus === 'EXPIRING_SOON'
    ).length;
    return { total, unpaid, medicalIssues };
  }, [members]);

  const handleMemberPress = (member: Member) => {
    router.push(`/(coach)/members/${member._id}`);
  };

  const renderMember = ({ item }: { item: Member }) => (
    <MemberCard member={item} onPress={handleMemberPress} />
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyContent}>
        <MaterialCommunityIcons name="account-group-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>
          {searchQuery || activeFilter !== 'all' ? t('empty.noResults') : t('empty.noMembers')}
        </Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? t('empty.noResultsDescription')
            : activeFilter !== 'all'
            ? t('members.noMembersFilter')
            : t('empty.noMembersDescription')}
        </Text>
      </Card.Content>
    </Card>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('members.searchMembers')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textSecondary}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <Chip
          selected={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          selectedColor={Colors.primary}
        >
          {t('common.all')} ({stats.total})
        </Chip>
        <Chip
          selected={activeFilter === 'unpaid'}
          onPress={() => setActiveFilter('unpaid')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          selectedColor={Colors.warning}
        >
          {t('status.unpaid')} ({stats.unpaid})
        </Chip>
        <Chip
          selected={activeFilter === 'medical'}
          onPress={() => setActiveFilter('medical')}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          selectedColor={Colors.error}
        >
          {t('members.medicalIssues')} ({stats.medicalIssues})
        </Chip>
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Card style={styles.miniStatCard}>
            <Card.Content style={styles.miniStatContent}>
              <Text style={styles.miniStatNumber}>{stats.total}</Text>
              <Text style={styles.miniStatLabel}>{t('dashboard.totalMembers')}</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.miniStatCard, { backgroundColor: Colors.warning + '20' }]}>
            <Card.Content style={styles.miniStatContent}>
              <Text style={[styles.miniStatNumber, { color: Colors.warning }]}>{stats.unpaid}</Text>
              <Text style={styles.miniStatLabel}>{t('status.unpaid')}</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.miniStatCard, { backgroundColor: Colors.error + '20' }]}>
            <Card.Content style={styles.miniStatContent}>
              <Text style={[styles.miniStatNumber, { color: Colors.error }]}>{stats.medicalIssues}</Text>
              <Text style={styles.miniStatLabel}>{t('medical.title')}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item._id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />

      {/* FAB for adding member - navigates to invite generation */}
      <FAB
        icon="account-plus"
        style={styles.fab}
        onPress={() => router.push('/(coach)/members/add')}
        color={Colors.text}
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
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  searchBar: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    color: Colors.text,
  },
  filterScroll: {
    maxHeight: 56,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    height: 36,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm + 4,
  },
  statsContainer: {
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  miniStatContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  miniStatNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  miniStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});
