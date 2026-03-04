import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { Text, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';
import { Post, Comment } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

interface PostWithAuthor extends Omit<Post, 'authorId'> {
  authorId?: {
    _id: string;
    fullName: string;
    profileImage?: string;
  } | string;
}

interface CommentWithAuthor extends Comment {
  authorId: {
    _id: string;
    fullName: string;
    profileImage?: string;
  } | string;
}

export default function PostDetailScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.data);
      setLikesCount(response.data.data.likesCount || 0);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert(t('common.error'), t('errors.loadFailed') || 'Failed to load post');
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${id}/comments`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPost(), fetchComments()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      fetchComments();
    }, [fetchComments])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      await api.post('/posts/like', {
        targetType: 'POST',
        targetId: id,
      });
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
      console.error('Error liking post:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${id}/comments`, {
        content: newComment.trim(),
      });
      setNewComment('');
      fetchComments();
      // Scroll to bottom after adding comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert(t('common.error'), t('errors.commentFailed') || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    // Basic share - could be expanded with react-native-share
    Alert.alert(
      t('common.share') || 'Share',
      t('posts.shareMessage') || 'Sharing will be available soon',
      [{ text: t('common.ok') || 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('time.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}${t('time.minutesShort') || 'm'}`;
    if (diffHours < 24) return `${diffHours}${t('time.hoursShort') || 'h'}`;
    if (diffDays < 7) return `${diffDays}${t('time.daysShort') || 'd'}`;
    return date.toLocaleDateString();
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getAuthorName = (comment: CommentWithAuthor) => {
    if (typeof comment.authorId === 'object' && comment.authorId?.fullName) {
      return comment.authorId.fullName;
    }
    return t('common.unknown') || 'Unknown';
  };

  const getAuthorAvatar = (comment: CommentWithAuthor) => {
    if (typeof comment.authorId === 'object' && comment.authorId?.profileImage) {
      return comment.authorId.profileImage;
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.errorText}>{t('errors.notFound') || 'Post not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.goBack') || 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const authorObj = post.authorId && typeof post.authorId === 'object' ? post.authorId : null;
  const authorName = authorObj?.fullName || 'Coach';
  const hasMultipleImages = post.images && post.images.length > 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('posts.post') || 'Post'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Post Card */}
        <Card style={styles.postCard}>
          <Card.Content>
            {/* Author Header */}
            <View style={styles.authorRow}>
              {authorObj?.profileImage ? (
                <Avatar.Image size={44} source={{ uri: authorObj.profileImage }} />
              ) : (
                <Avatar.Text size={44} label={getInitials(authorName)} style={styles.avatar} />
              )}
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{authorName}</Text>
                <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>

            {/* Title */}
            {post.title && <Text style={styles.postTitle}>{post.title}</Text>}

            {/* Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: post.images[currentImageIndex] }}
                  style={styles.media}
                  resizeMode="cover"
                />
                {hasMultipleImages && (
                  <>
                    {currentImageIndex > 0 && (
                      <TouchableOpacity
                        style={[styles.imageNavButton, styles.imageNavLeft]}
                        onPress={() => setCurrentImageIndex((prev) => prev - 1)}
                      >
                        <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text} />
                      </TouchableOpacity>
                    )}
                    {currentImageIndex < post.images.length - 1 && (
                      <TouchableOpacity
                        style={[styles.imageNavButton, styles.imageNavRight]}
                        onPress={() => setCurrentImageIndex((prev) => prev + 1)}
                      >
                        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text} />
                      </TouchableOpacity>
                    )}
                    <View style={styles.imageIndicators}>
                      {post.images.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.indicator,
                            index === currentImageIndex && styles.indicatorActive,
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <MaterialCommunityIcons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={liked ? Colors.error : Colors.textSecondary}
                />
                {likesCount > 0 && (
                  <Text style={[styles.actionText, liked && styles.actionTextLiked]}>{likesCount}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.actionButton}>
                <MaterialCommunityIcons name="comment-outline" size={22} color={Colors.textSecondary} />
                {comments.length > 0 && <Text style={styles.actionText}>{comments.length}</Text>}
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <MaterialCommunityIcons name="share-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            {t('posts.comments') || 'Comments'} ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <MaterialCommunityIcons name="comment-outline" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('posts.noComments') || 'No comments yet'}</Text>
              <Text style={styles.emptySubtext}>{t('posts.beFirst') || 'Be the first to comment!'}</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment._id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  {getAuthorAvatar(comment) ? (
                    <Avatar.Image size={36} source={{ uri: getAuthorAvatar(comment)! }} />
                  ) : (
                    <Avatar.Text
                      size={36}
                      label={getInitials(getAuthorName(comment))}
                      style={styles.commentAvatar}
                    />
                  )}
                  <View style={styles.commentHeaderInfo}>
                    <Text style={styles.commentAuthor}>{getAuthorName(comment)}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t('posts.writeComment') || 'Write a comment...'}
            placeholderTextColor={Colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    padding: Spacing.lg,
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
    textAlign: 'center',
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  postCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  authorInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  postTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  postContent: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavLeft: {
    left: Spacing.sm,
  },
  imageNavRight: {
    right: Spacing.sm,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary + '80',
  },
  indicatorActive: {
    backgroundColor: Colors.text,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  actionTextLiked: {
    color: Colors.error,
  },
  commentsSection: {
    padding: Spacing.md,
  },
  commentsTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyComments: {
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
  },
  commentCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commentAvatar: {
    backgroundColor: Colors.primary,
  },
  commentHeaderInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  commentAuthor: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  commentTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  commentContent: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
});
