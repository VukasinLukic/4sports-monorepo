import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createPost,
  getClubPosts,
  getPostById,
  updatePost,
  deletePost,
  createComment,
  getPostComments,
  deleteComment,
  toggleLike,
} from '../controllers/postController';

const router = express.Router();

// ============================================
// POST ROUTES
// ============================================

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Protected (OWNER, COACH)
 */
router.post('/', protect, createPost);

/**
 * @route   GET /api/posts
 * @desc    Get all posts for the club (filtered by visibility)
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.get('/', protect, getClubPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.get('/:id', protect, getPostById);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Protected (OWNER, Author)
 */
router.put('/:id', protect, updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Protected (OWNER, Author)
 */
router.delete('/:id', protect, deletePost);

// ============================================
// COMMENT ROUTES
// ============================================

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Create a comment on a post
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.post('/:postId/comments', protect, createComment);

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get all comments for a post
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.get('/:postId/comments', protect, getPostComments);

/**
 * @route   DELETE /api/posts/comments/:id
 * @desc    Delete a comment
 * @access  Protected (OWNER, Author)
 */
router.delete('/comments/:id', protect, deleteComment);

// ============================================
// LIKE ROUTES
// ============================================

/**
 * @route   POST /api/posts/like
 * @desc    Toggle like on a post or comment
 * @access  Protected (OWNER, COACH, PARENT)
 */
router.post('/like', protect, toggleLike);

export default router;
