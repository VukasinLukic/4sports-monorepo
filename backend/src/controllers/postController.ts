import { Request, Response } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Like from '../models/Like';
import Notification from '../models/Notification';
import User from '../models/User';

// ============================================
// POST MANAGEMENT
// ============================================

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { title, content, images, visibility, tags, isPinned } = req.body;
    const clubId = req.user.clubId;

    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });
    if (!title || !content) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
    }

    // Only OWNER can pin posts
    const finalIsPinned = req.user.role === 'OWNER' ? isPinned : false;

    const post = await Post.create({
      clubId,
      authorId: req.user._id,
      title,
      content,
      images: images || [],
      visibility: visibility || 'PUBLIC',
      tags: tags || [],
      isPinned: finalIsPinned,
    });

    // Create notifications for all club members (except author)
    try {
      const clubMembers = await User.find({
        clubId,
        _id: { $ne: req.user._id },
      }).select('_id');

      const notificationPromises = clubMembers.map((member) =>
        Notification.createNotification({
          clubId,
          recipientId: member._id,
          senderId: req.user!._id,
          type: 'NEW_POST',
          title: 'Nova objava',
          message: `${req.user!.fullName} je objavio: ${title}`,
          data: { postId: post._id },
          priority: 'MEDIUM',
        })
      );

      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Failed to create notifications for new post:', notifError);
      // Don't fail the post creation if notifications fail
    }

    return res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    console.error('❌ Create Post Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create post' } });
  }
};

export const getClubPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const clubId = req.user.clubId;
    if (!clubId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You must be associated with a club' } });

    // Determine visibility based on user role
    let visibilityFilter: string[] = [];
    if (req.user.role === 'OWNER' || req.user.role === 'COACH') {
      visibilityFilter = ['PUBLIC', 'MEMBERS_ONLY', 'PARENTS_ONLY', 'COACHES_ONLY'];
    } else if (req.user.role === 'PARENT' || req.user.role === 'MEMBER') {
      visibilityFilter = ['PUBLIC', 'MEMBERS_ONLY', 'PARENTS_ONLY'];
    }

    const posts = await Post.findByClub(clubId, visibilityFilter);

    // Get user's likes for these posts
    const postIds = posts.map((p: any) => p._id);
    const userLikes = await Like.find({
      userId: req.user._id,
      targetType: 'POST',
      targetId: { $in: postIds },
    });
    const likedPostIds = new Set(userLikes.map((l) => l.targetId.toString()));

    // Add isLiked flag to each post
    const postsWithLikeStatus = posts.map((post: any) => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString()),
    }));

    return res.status(200).json({ success: true, data: postsWithLikeStatus });
  } catch (error: any) {
    console.error('❌ Get Posts Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch posts' } });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const post = await Post.findById(id).populate('authorId', 'fullName profileImage');
    if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });

    // Check visibility access
    if (post.visibility === 'COACHES_ONLY' && req.user.role !== 'OWNER' && req.user.role !== 'COACH') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }
    if (post.visibility === 'PARENTS_ONLY' && req.user.role !== 'OWNER' && req.user.role !== 'COACH' && req.user.role !== 'PARENT') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error: any) {
    console.error('❌ Get Post Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch post' } });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;
    const { title, content, images, visibility, tags, isPinned } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });

    // Only author or OWNER can update
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (images) post.images = images;
    if (visibility) post.visibility = visibility;
    if (tags) post.tags = tags;

    // Only OWNER can change pinned status
    if (isPinned !== undefined && req.user.role === 'OWNER') {
      post.isPinned = isPinned;
    }

    await post.save();
    return res.status(200).json({ success: true, data: post });
  } catch (error: any) {
    console.error('❌ Update Post Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update post' } });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });

    // Only author or OWNER can delete
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    await post.deleteOne();

    // Delete all comments and likes for this post
    await Comment.deleteMany({ postId: id });
    await Like.deleteMany({ targetType: 'POST', targetId: id });

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Post Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete post' } });
  }
};

// ============================================
// COMMENT MANAGEMENT
// ============================================

export const createComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Content is required' } });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });

    const comment = await Comment.create({
      postId,
      authorId: req.user._id,
      content,
    });

    // Increment post comments count
    await Post.incrementComments(postId as any);

    // Notify post author about new comment (if not commenting on own post)
    if (post.authorId.toString() !== req.user._id.toString()) {
      try {
        await Notification.createNotification({
          clubId: post.clubId,
          recipientId: post.authorId,
          senderId: req.user!._id,
          type: 'NEW_COMMENT',
          title: 'Novi komentar',
          message: `${req.user!.fullName} je komentarisao vašu objavu`,
          data: { postId: post._id, commentId: comment._id },
          priority: 'LOW',
        });
      } catch (notifError) {
        console.error('Failed to create notification for comment:', notifError);
      }
    }

    return res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    console.error('❌ Create Comment Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create comment' } });
  }
};

export const getPostComments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { postId } = req.params;

    const comments = await Comment.findByPost(postId as any);

    // Get user's likes for these comments
    const commentIds = comments.map((c: any) => c._id);
    const userLikes = await Like.find({
      userId: req.user._id,
      targetType: 'COMMENT',
      targetId: { $in: commentIds },
    });
    const likedCommentIds = new Set(userLikes.map((l) => l.targetId.toString()));

    // Add isLiked flag to each comment
    const commentsWithLikeStatus = comments.map((comment: any) => ({
      ...comment.toObject(),
      isLiked: likedCommentIds.has(comment._id.toString()),
    }));

    return res.status(200).json({ success: true, data: commentsWithLikeStatus });
  } catch (error: any) {
    console.error('❌ Get Comments Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch comments' } });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } });

    // Only author or OWNER can delete
    if (comment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const postId = comment.postId;
    await comment.deleteOne();

    // Decrement post comments count
    await Post.decrementComments(postId);

    // Delete all likes for this comment
    await Like.deleteMany({ targetType: 'COMMENT', targetId: id });

    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Comment Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete comment' } });
  }
};

// ============================================
// LIKE MANAGEMENT
// ============================================

export const toggleLike = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { targetType, targetId } = req.body;

    if (!targetType || !targetId || !['POST', 'COMMENT'].includes(targetType)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid targetType or targetId' } });
    }

    const existingLike = await Like.findOne({ userId: req.user._id, targetType, targetId });

    if (existingLike) {
      await existingLike.deleteOne();

      if (targetType === 'POST') {
        await Post.decrementLikes(targetId);
      } else {
        await Comment.decrementLikes(targetId);
      }

      return res.status(200).json({ success: true, data: { liked: false } });
    } else {
      await Like.create({ userId: req.user._id, targetType, targetId });

      if (targetType === 'POST') {
        await Post.incrementLikes(targetId);
      } else {
        await Comment.incrementLikes(targetId);
      }

      return res.status(200).json({ success: true, data: { liked: true } });
    }
  } catch (error: any) {
    console.error('❌ Toggle Like Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to toggle like' } });
  }
};
