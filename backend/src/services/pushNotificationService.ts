import User from '../models/User';
import mongoose from 'mongoose';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: { error?: string };
  }>;
}

/**
 * Send push notification to user(s) via Expo Push API
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

    console.log(`📱 Push: sending to ${userIds.length} users, found ${users.length} with tokens, ${tokens.length} valid tokens`);
    console.log(`📱 Push: tokens = ${tokens.map(t => t.substring(0, 30) + '...').join(', ')}`);

    if (tokens.length === 0) {
      console.log('⚠️  No valid push tokens found');
      return;
    }

    // Prepare Expo push messages
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    }));

    // Send via Expo Push API (supports batching up to 100)
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json() as ExpoPushResponse;
    console.log(`📱 Push API response:`, JSON.stringify(result));

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    result.data.forEach((receipt, idx) => {
      if (receipt.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        // Clean up tokens with DeviceNotRegistered error (app uninstalled)
        if (receipt.details?.error === 'DeviceNotRegistered' && tokens[idx]) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    console.log(`✅ Push notifications sent: ${successCount} successful, ${failureCount} failed`);

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await User.updateMany(
        { pushToken: { $in: invalidTokens } },
        { $unset: { pushToken: '' } }
      );
      console.log(`🧹 Removed ${invalidTokens.length} invalid push tokens`);
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
