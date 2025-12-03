import { Request, Response } from 'express';
import Notification from '../models/Notification';

// ============================================
// NOTIFICATION RETRIEVAL
// ============================================

export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await Notification.findByRecipient(req.user._id, { unreadOnly, limit });
    return res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('❌ Get Notifications Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch notifications' } });
  }
};

export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const notifications = await Notification.findByRecipient(req.user._id, { unreadOnly: true, limit });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('❌ Get Unread Notifications Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch unread notifications' } });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const count = await Notification.getUnreadCount(req.user._id);
    return res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('❌ Get Unread Count Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch unread count' } });
  }
};

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }

    // Verify ownership
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const updatedNotification = await Notification.markAsRead(notification._id);
    return res.status(200).json({ success: true, data: updatedNotification });
  } catch (error: any) {
    console.error('❌ Mark As Read Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark notification as read' } });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    const result = await Notification.markAllAsRead(req.user._id);
    return res.status(200).json({
      success: true,
      data: {
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error: any) {
    console.error('❌ Mark All As Read Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to mark all notifications as read' } });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }

    // Verify ownership
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    await notification.deleteOne();
    return res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete Notification Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete notification' } });
  }
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Note: Notification preferences will be stored in the User model
// This is a placeholder for future implementation
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // TODO: Implement notification preferences in User model
    // For now, return default preferences
    const defaultPreferences = {
      eventReminders: { inApp: true, push: true, email: true },
      paymentDue: { inApp: true, push: true, email: true },
      medicalExpiry: { inApp: true, push: true, email: true },
      newPost: { inApp: true, push: false, email: false },
      newComment: { inApp: true, push: false, email: false },
      attendanceMarked: { inApp: true, push: true, email: false },
      inviteAccepted: { inApp: true, push: true, email: false },
    };

    return res.status(200).json({ success: true, data: defaultPreferences });
  } catch (error: any) {
    console.error('❌ Get Notification Preferences Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch notification preferences' } });
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });

    // TODO: Implement notification preferences update in User model
    const { preferences } = req.body;

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated (feature coming soon)',
      data: preferences
    });
  } catch (error: any) {
    console.error('❌ Update Notification Preferences Error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update notification preferences' } });
  }
};
