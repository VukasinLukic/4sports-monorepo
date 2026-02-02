import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Text, Avatar, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';

const { height: screenHeight } = Dimensions.get('window');
const SHEET_HEIGHT = screenHeight * 0.75;

interface CommentAuthor {
  _id: string;
  fullName: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  content: string;
  authorId: CommentAuthor | string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

interface CommentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  basePath: '/(member)' | '/(coach)' | '/(parent)';
}

export default function CommentBottomSheet({
  visible,
  onClose,
  postId,
  basePath,
}: CommentBottomSheetProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animation for slide up/down
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [translateY]);

  const closeSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [translateY, onClose]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible) {
      fetchComments();
      openSheet();
    } else {
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible, fetchComments, openSheet, translateY]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment('');
      fetchComments();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert(t('common.error'), t('errors.commentFailed') || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await api.post('/posts/like', {
        targetType: 'COMMENT',
        targetId: commentId,
      });
      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likesCount: c.isLiked ? (c.likesCount || 1) - 1 : (c.likesCount || 0) + 1,
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleAvatarPress = (authorId: string) => {
    closeSheet();
    // Navigate to profile based on basePath
    setTimeout(() => {
      if (basePath === '/(coach)') {
        router.push(`/(coach)/members/${authorId}` as any);
      } else if (basePath === '/(member)') {
        // Members can view other members' basic profile
        router.push(`/(member)/members/${authorId}` as any);
      } else if (basePath === '/(parent)') {
        router.push(`/(parent)/members/${authorId}` as any);
      }
    }, 300);
  };

  const getAuthorName = (comment: Comment) => {
    if (typeof comment.authorId === 'object' && comment.authorId?.fullName) {
      return comment.authorId.fullName;
    }
    return t('common.unknown') || 'Unknown';
  };

  const getAuthorAvatar = (comment: Comment) => {
    if (typeof comment.authorId === 'object' && comment.authorId?.profilePicture) {
      return comment.authorId.profilePicture;
    }
    return null;
  };

  const getAuthorId = (comment: Comment) => {
    if (typeof comment.authorId === 'object') {
      return comment.authorId._id;
    }
    return comment.authorId;
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

  const renderComment = ({ item }: { item: Comment }) => {
    const authorName = getAuthorName(item);
    const authorAvatar = getAuthorAvatar(item);
    const authorId = getAuthorId(item);

    return (
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={() => handleAvatarPress(authorId)}>
          {authorAvatar ? (
            <Avatar.Image size={36} source={{ uri: authorAvatar }} />
          ) : (
            <Avatar.Text size={36} label={getInitials(authorName)} style={styles.avatar} />
          )}
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => handleAvatarPress(authorId)}>
              <Text style={styles.authorName}>{authorName}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleLikeComment(item._id)}
        >
          <MaterialCommunityIcons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={item.isLiked ? Colors.error : Colors.textSecondary}
          />
          {(item.likesCount || 0) > 0 && (
            <Text style={[styles.likeCount, item.isLiked && styles.likeCountActive]}>
              {item.likesCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeSheet}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeSheet}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t('posts.comments') || 'Comments'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={Colors.textSecondary}
              onPress={closeSheet}
            />
          </View>

          {/* Comments List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="comment-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {t('posts.noComments') || 'No comments yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('posts.beFirst') || 'Be the first to comment!'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input */}
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
                style={[
                  styles.sendButton,
                  (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled,
                ]}
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  commentsList: {
    padding: Spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  commentTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  likeButton: {
    alignItems: 'center',
    paddingTop: 2,
  },
  likeCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  likeCountActive: {
    color: Colors.error,
  },
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
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
