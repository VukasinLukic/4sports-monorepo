import { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Avatar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { Post } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - (Spacing.md * 2) - (Spacing.md * 2);

interface PostCardProps {
  post: Post;
  authorName?: string;
  authorAvatar?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onPress?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({
  post,
  authorName = 'Unknown',
  authorAvatar,
  onLike,
  onComment,
  onPress,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    onLike?.(post._id);
  };

  const handleNextImage = () => {
    if (post.images && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const hasMultipleImages = post.images && post.images.length > 1;

  return (
    <Card style={styles.card} onPress={() => onPress?.(post)}>
      <Card.Content style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {authorAvatar ? (
            <Avatar.Image size={40} source={{ uri: authorAvatar }} />
          ) : (
            <Avatar.Text size={40} label={getInitials(authorName)} style={styles.avatar} />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
          </View>
          {(onEdit || onDelete) && (
            <View style={styles.headerActions}>
              {onEdit && (
                <IconButton
                  icon="pencil-outline"
                  size={18}
                  iconColor={Colors.textSecondary}
                  onPress={() => onEdit(post)}
                  style={styles.headerActionButton}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  iconColor={Colors.error}
                  onPress={() => onDelete(post._id)}
                  style={styles.headerActionButton}
                />
              )}
            </View>
          )}
        </View>

        {/* Title */}
        {post.title && <Text style={styles.postTitle}>{post.title}</Text>}

        {/* Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.images && post.images.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: post.images[currentImageIndex] }}
              style={styles.media}
              resizeMode="contain"
            />

            {/* Image Navigation */}
            {hasMultipleImages && (
              <>
                {currentImageIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.imageNavLeft]}
                    onPress={handlePrevImage}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.text} />
                  </TouchableOpacity>
                )}
                {currentImageIndex < post.images.length - 1 && (
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.imageNavRight]}
                    onPress={handleNextImage}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text} />
                  </TouchableOpacity>
                )}

                {/* Image Indicators */}
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
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? Colors.error : Colors.textSecondary}
            />
            {(post.likesCount || 0) > 0 && (
              <Text style={[styles.actionText, post.isLiked && styles.actionTextLiked]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment?.(post._id)}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={22}
              color={Colors.textSecondary}
            />
            {post.commentsCount > 0 && (
              <Text style={styles.actionText}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons
              name="share-outline"
              size={22}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  content: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -Spacing.xs,
  },
  headerActionButton: {
    margin: 0,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  postContent: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  mediaContainer: {
    position: 'relative',
    marginHorizontal: Spacing.md,
    height: 300,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
});
