import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator, Chip, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';
import PostCard from '@/components/PostCard';
import api from '@/services/api';
import { Post, Group } from '@/types';

interface PostWithAuthor extends Post {
  author?: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
}

export default function CoachNewsFeed() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch posts
      const params: Record<string, string> = {};
      if (selectedGroupId) {
        params.groupId = selectedGroupId;
      }

      const postsResponse = await api.get('/posts', { params });
      setPosts(postsResponse.data.data || []);

      // Fetch groups for filter
      if (groups.length === 0) {
        try {
          const groupsResponse = await api.get('/groups');
          setGroups(groupsResponse.data.data || []);
        } catch {
          // Groups might not be available
        }
      }
    } catch (error) {
      console.error('Error fetching news feed:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedGroupId, groups.length]);

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

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail/comments
    console.log('Open comments for post:', postId);
  };

  const renderPost = ({ item }: { item: PostWithAuthor }) => (
    <PostCard
      post={item}
      authorName={item.author?.fullName || 'Coach'}
      authorAvatar={item.author?.profilePicture}
      onLike={handleLike}
      onComment={handleComment}
    />
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyContent}>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptyText}>
          Share news, updates, and announcements with your club members
        </Text>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>News Feed</Text>

      {/* Group Filter */}
      {groups.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: null, name: 'All Groups' }, ...groups]}
          keyExtractor={(item) => item._id || 'all'}
          style={styles.filterList}
          contentContainerStyle={styles.filterContainer}
          renderItem={({ item }) => (
            <Chip
              selected={selectedGroupId === item._id}
              onPress={() => setSelectedGroupId(item._id)}
              style={styles.filterChip}
              textStyle={styles.filterChipText}
              selectedColor={Colors.primary}
            >
              {item.name}
            </Chip>
          )}
        />
      )}
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading news feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(coach)/news/create')}
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
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterList: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
  },
  filterChipText: {
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
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
