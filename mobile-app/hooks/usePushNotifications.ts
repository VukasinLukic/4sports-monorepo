import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
  removeTokenFromBackend,
  parseNotificationData,
  NotificationData,
  NotificationType,
} from '@/services/pushNotifications';

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  registerForNotifications: () => Promise<void>;
  unregisterFromNotifications: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Handle notification navigation based on type
  const handleNotificationNavigation = useCallback((data: NotificationData) => {
    switch (data.type) {
      case 'EVENT_REMINDER':
        if (data.eventId) {
          router.push(`/(coach)/attendance/${data.eventId}`);
        }
        break;

      case 'PAYMENT_REMINDER':
        if (data.memberId) {
          router.push({
            pathname: '/(coach)/payments/record',
            params: { memberId: data.memberId },
          });
        } else {
          router.push('/(coach)/members');
        }
        break;

      case 'MEDICAL_REMINDER':
        if (data.memberId) {
          router.push({
            pathname: '/(coach)/medical/record',
            params: { memberId: data.memberId },
          });
        } else {
          router.push('/(coach)/members');
        }
        break;

      case 'ATTENDANCE_MARKED':
        // Parent notification - navigate to member details
        if (data.memberId) {
          router.push(`/(parent)/member/${data.memberId}`);
        }
        break;

      case 'NEW_POST':
        // Navigate to news feed
        router.push('/(coach)/news');
        break;

      case 'GENERAL':
      default:
        // Just acknowledge, no navigation
        break;
    }
  }, []);

  // Register for push notifications
  const registerForNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await registerForPushNotificationsAsync();

      if (token) {
        setExpoPushToken(token);

        // Send token to backend
        const success = await sendTokenToBackend(token);
        setIsRegistered(success);

        if (!success) {
          setError('Failed to register with server');
        }
      } else {
        // Token is null - push notifications not available (Expo Go or missing projectId)
        // This is expected in development, not an error
        console.log('Push notifications not available in this environment');
        setIsRegistered(false);
        // Don't set error - this is expected behavior in Expo Go
      }
    } catch (err) {
      console.error('Error registering for notifications:', err);
      setError('Failed to register for notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unregister from push notifications
  const unregisterFromNotifications = useCallback(async () => {
    if (expoPushToken) {
      await removeTokenFromBackend(expoPushToken);
      setIsRegistered(false);
    }
  }, [expoPushToken]);

  // Setup notification listeners
  useEffect(() => {
    // Register for notifications on mount
    registerForNotifications();

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      setNotification(notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = parseNotificationData(response.notification);
      if (data) {
        handleNotificationNavigation(data);
      }
    });

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [registerForNotifications, handleNotificationNavigation]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    error,
    registerForNotifications,
    unregisterFromNotifications,
  };
}

/**
 * Hook to check if notification permission is granted
 */
export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
      setIsChecking(false);
    }
    checkPermission();
  }, []);

  const requestPermission = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  return { hasPermission, isChecking, requestPermission };
}
