import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

/**
 * Register for push notifications and get Expo Push Token
 * Returns { token, error } to provide detailed failure info
 */
export async function registerForPushNotificationsAsync(): Promise<{ token: string | null; error: string | null }> {
  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    return { token: null, error: 'Not a physical device' };
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { token: null, error: `Permission ${finalStatus}` };
  }

  // Get Expo Push Token
  let token: string | null = null;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId
      ?? (Constants as any).manifest2?.extra?.eas?.projectId
      ?? (Constants as any).manifest?.extra?.eas?.projectId;

    if (!projectId || projectId.length < 10) {
      return { token: null, error: `No projectId (expoConfig: ${!!Constants.expoConfig})` };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenResponse.data;
  } catch (error: any) {
    return { token: null, error: `Token error: ${error?.message?.substring(0, 80)}` };
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4caf50',
    });

    // Event reminders channel
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196f3',
    });

    // Payment reminders channel
    await Notifications.setNotificationChannelAsync('payments', {
      name: 'Payment Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#ff9800',
    });
  }

  return { token, error: null };
}

/**
 * Send push token to backend for storage
 */
export async function sendTokenToBackend(token: string): Promise<boolean> {
  try {
    await api.post('/chat/fcm-token', {
      token,
    });
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

/**
 * Remove push token from backend (on logout)
 */
export async function removeTokenFromBackend(token: string): Promise<boolean> {
  try {
    await api.post('/chat/fcm-token', { token: '' });
    console.log('Push token removed from backend');
    return true;
  } catch (error) {
    console.error('Failed to remove push token from backend:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  triggerSeconds?: number
): Promise<string> {
  const trigger = triggerSeconds ? { seconds: triggerSeconds } : null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all pending notifications
 */
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Dismiss all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

// Notification types for navigation
export type NotificationType =
  | 'EVENT_REMINDER'
  | 'PAYMENT_REMINDER'
  | 'MEDICAL_REMINDER'
  | 'ATTENDANCE_MARKED'
  | 'NEW_POST'
  | 'GENERAL';

export interface NotificationData {
  type: NotificationType;
  eventId?: string;
  memberId?: string;
  postId?: string;
  [key: string]: unknown;
}

/**
 * Parse notification data for navigation
 */
export function parseNotificationData(notification: Notifications.Notification): NotificationData | null {
  try {
    const data = notification.request.content.data as NotificationData;
    return data;
  } catch {
    return null;
  }
}
