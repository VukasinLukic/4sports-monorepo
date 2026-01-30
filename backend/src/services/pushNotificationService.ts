import { getMessaging } from '../config/firebase';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Send push notification to user(s)
 * @param userIds - Array of user IDs to send notification to
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data payload
 */
export const sendPushNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    // Get users with push tokens
    const users = await User.find({
      _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
      pushToken: { $exists: true, $ne: null },
    }).select('pushToken');

    if (users.length === 0) {
      console.log('⚠️  No users with push tokens found');
      return;
    }

    const tokens = users.map((user) => user.pushToken).filter((token): token is string => !!token);

    if (tokens.length === 0) {
      console.log('⚠️  No valid push tokens found');
      return;
    }

    const messaging = getMessaging();

    // Prepare messages for each token
    const messages = tokens.map((token) => ({
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    }));

    // Send to multiple devices
    const response = await messaging.sendEach(messages);

    console.log(`✅ Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && tokens[idx]) {
          failedTokens.push(tokens[idx]);
        }
      });

      if (failedTokens.length > 0) {
        // Remove invalid tokens from database
        await User.updateMany(
          { pushToken: { $in: failedTokens } },
          { $unset: { pushToken: '' } }
        );
        console.log(`🧹 Removed ${failedTokens.length} invalid push tokens`);
      }
    }
  } catch (error) {
    console.error('❌ Push Notification Error:', error);
    throw error;
  }
};

/**
 * Send chat message notification
 * @param recipientIds - Array of recipient user IDs
 * @param senderName - Name of message sender
 * @param messageText - Message text (trimmed)
 * @param conversationId - Conversation ID for navigation
 */
export const sendChatMessageNotification = async (
  recipientIds: string[],
  senderName: string,
  messageText: string,
  conversationId: string
): Promise<void> => {
  try {
    // Trim message text
    const trimmedMessage = messageText.length > 50
      ? `${messageText.substring(0, 50)}...`
      : messageText;

    await sendPushNotification(
      recipientIds,
      senderName,
      trimmedMessage || '📷 Image',
      {
        type: 'chat_message',
        conversationId,
      }
    );
  } catch (error) {
    console.error('❌ Chat Message Notification Error:', error);
  }
};
