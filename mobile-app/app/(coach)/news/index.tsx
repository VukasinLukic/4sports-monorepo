import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator, Chip, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import PostCard from '@/components/PostCard';
import CommentBottomSheet from '@/components/CommentBottomSheet';
import api from '@/services/api';
import { Post } from '@/types';

interface PostWithAuthor extends Omit<Post, 'authorId'> {
  authorId?: {
    _id: string;
    fullName: string;
    profileImage?: string;
  } | string;
}

export default function CoachNewsFeed() {
  const { t } = useLanguage();
  const { postId: scrollToPostId, openComments } = useLocalSearchParams<{ postId?: string; openComments?: string }>();
  const flatListRef = useRef<FlatList>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [hasScrolledToPost, setHasScrolledToPost] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const postsResponse = await api.get('/posts');
      setPosts(postsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching news feed:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Scroll to post and open comments if coming from notification
  useEffect(() => {
    if (scrollToPostId && posts.length > 0 && !hasScrolledToPost) {
      const postIndex = posts.findIndex(p => p._id === scrollToPostId);
      if (postIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: postIndex, animated: true });
          if (openComments === 'true') {
            setSelectedPostId(scrollToPostId);
            setCommentSheetVisible(true);
          }
          setHasScrolledToPost(true);
        }, 300);
      }
    }
  }, [scrollToPostId, openComments, posts, hasScrolledToPost]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post('/posts/like', {
        targetType: 'POST',
        targetId: postId,
      });
      fetchData();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentSheetVisible(true);
  };

  const handleCloseCommentSheet = () => {
    setCommentSheetVisible(false);
    setSelectedPostId(null);
    fetchData();
  };

  const handlePostPress = (post: Post) => {
    // Open comments instead of navigating to post detail
    setSelectedPostId(post._id);
    setCommentSheetVisible(true);
  };

  const renderPost = ({ item }: { item: PostWithAuthor }) => {
    const authorObj = item.authorId && typeof item.authorId === 'object' ? item.authorId : null;
    return (
      <PostCard
        post={item}
        authorName={authorObj?.fullName || t('roles.coach')}
        authorAvatar={authorObj?.profileImage}
        onLike={handleLike}
        onComment={handleComment}
        onPress={handlePostPress}
      />
    );
  };

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyContent}>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>{t('news.noPosts') || 'No Posts Yet'}</Text>
        <Text style={styles.emptyText}>
          {t('news.noPostsDescription') || 'Share news, updates, and announcements with your club members'}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/(coach)/news/create')}
          style={styles.createPostButton}
        >
          {t('news.createPost') || 'Create Post'}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('news.title') || 'News Feed'}</Text>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('news.loadingFeed') || 'Loading news feed...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
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
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
      />

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(coach)/news/create')}
        color={Colors.text}
      />

      {/* Comment Bottom Sheet */}
      {selectedPostId && (
        <CommentBottomSheet
          visible={commentSheetVisible}
          onClose={handleCloseCommentSheet}
          postId={selectedPostId}
          basePath="/(coach)"
        />
      )}
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
  createPostButton: {
    marginTop: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});
