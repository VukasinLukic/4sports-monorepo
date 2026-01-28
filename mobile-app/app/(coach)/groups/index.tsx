import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  FAB,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Group } from '@/types';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      const groupsData = response.data.data || [];
      setGroups(groupsData);
      setFilteredGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (group) =>
            group.name.toLowerCase().includes(query) ||
            group.ageGroup?.toLowerCase().includes(query) ||
            group.sport?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, groups]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchGroups();
  };

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/(coach)/groups/[id]',
      params: { id: group._id },
    });
  };

  const handleCreateGroup = () => {
    router.push('/(coach)/groups/form');
  };

  const getGroupColor = (group: Group) => {
    return group.color || Colors.primary;
  };

  const renderGroupCard = ({ item: group }: { item: Group }) => (
    <TouchableOpacity onPress={() => handleGroupPress(group)} activeOpacity={0.7}>
      <Card style={styles.groupCard}>
        <View style={[styles.colorBar, { backgroundColor: getGroupColor(group) }]} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.groupHeader}>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.tagsContainer}>
                {group.ageGroup && (
                  <Chip
                    mode="flat"
                    style={styles.tagChip}
                    textStyle={styles.tagChipText}
                    compact
                  >
                    {group.ageGroup}
                  </Chip>
                )}
                {group.sport && (
                  <Chip
                    mode="flat"
                    style={[styles.tagChip, styles.sportChip]}
                    textStyle={styles.tagChipText}
                    compact
                  >
                    {group.sport}
                  </Chip>
                )}
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.textSecondary}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>
                {group.memberCount || 0} members
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="whistle"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>
                {group.coachIds?.length || 0} coaches
              </Text>
            </View>
          </View>

          {group.description && (
            <Text style={styles.description} numberOfLines={2}>
              {group.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search groups..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={Colors.textSecondary}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No groups found' : 'No groups yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first group to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB for creating new group */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.surface}
        onPress={handleCreateGroup}
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
  searchBar: {
    margin: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    elevation: 0,
  },
  searchInput: {
    color: Colors.text,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    paddingTop: Spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tagChip: {
    backgroundColor: Colors.primary + '20',
    height: 28,
    justifyContent: 'center',
  },
  sportChip: {
    backgroundColor: Colors.secondary + '20',
  },
  tagChipText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: FontSize.xs + 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
