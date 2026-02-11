import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createConversation,
  getConversations,
  sendMessage,
  markAsRead,
  updateFCMToken,
  getClubUsersForChat,
} from '../controllers/chatController';

const router = express.Router();

/**
 * @route   POST /api/v1/chat/conversations
 * @desc    Create or get existing conversation
 * @access  Protected
 */
router.post('/conversations', protect, createConversation);

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get user's conversations
 * @access  Protected
 */
router.get('/conversations', protect, getConversations);

/**
 * @route   POST /api/v1/chat/conversations/:conversationId/messages
 * @desc    Send message in conversation
 * @access  Protected
 */
router.post('/conversations/:conversationId/messages', protect, sendMessage);

/**
 * @route   POST /api/v1/chat/conversations/:conversationId/read
 * @desc    Mark messages as read
 * @access  Protected
 */
router.post('/conversations/:conversationId/read', protect, markAsRead);

/**
 * @route   GET /api/v1/chat/users
 * @desc    Get club users for starting new conversations
 * @access  Protected
 */
router.get('/users', protect, getClubUsersForChat);

/**
 * @route   POST /api/v1/chat/fcm-token
 * @desc    Update user's FCM token for push notifications
 * @access  Protected
 */
router.post('/fcm-token', protect, updateFCMToken);

export default router;
