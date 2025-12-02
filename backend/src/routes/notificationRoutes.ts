import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notificationController';

const router = express.Router();

// ============================================
// NOTIFICATION ROUTES
// ============================================

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the authenticated user
 * @query   limit - Number of notifications to return (default: 50)
 * @query   unreadOnly - Only return unread notifications (default: false)
 * @access  Protected (All authenticated users)
 */
router.get('/', protect, getNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications for the authenticated user
 * @query   limit - Number of notifications to return (default: 50)
 * @access  Protected (All authenticated users)
 */
router.get('/unread', protect, getUnreadNotifications);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get count of unread notifications
 * @access  Protected (All authenticated users)
 */
router.get('/unread/count', protect, getUnreadCount);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Protected (Notification recipient)
 */
router.patch('/:id/read', protect, markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Protected (All authenticated users)
 */
router.patch('/read-all', protect, markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Protected (Notification recipient)
 */
router.delete('/:id', protect, deleteNotification);

// ============================================
// NOTIFICATION PREFERENCES ROUTES
// ============================================

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences for the authenticated user
 * @access  Protected (All authenticated users)
 */
router.get('/preferences', protect, getNotificationPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Protected (All authenticated users)
 */
router.put('/preferences', protect, updateNotificationPreferences);

export default router;
