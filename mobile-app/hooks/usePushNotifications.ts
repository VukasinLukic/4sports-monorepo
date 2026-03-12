import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
  removeTokenFromBackend,
  parseNotificationData,
  NotificationData,
  NotificationType,
} from '@/services/pushNotifications';

const NOTIFICATION_PREF_KEY = '@push_notifications_enabled';
const PUSH_TOKEN_KEY = '@push_token';

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  debugInfo: string;
  registerForNotifications: () => Promise<void>;
  unregisterFromNotifications: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(true); // Default ON
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const hasInitialized = useRef(false);

  const updateDebugInfo = useCallback((token: string | null, registered: boolean, err: string | null) => {
    const tokenInfo = token ? `Token: ${token.substring(0, 25)}...` : 'Token: none';
    const regInfo = `Registered: ${registered}`;
    const errInfo = err ? `Error: ${err}` : '';
    setDebugInfo([tokenInfo, regInfo, errInfo].filter(Boolean).join(' | '));
  }, []);

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
      const result = await registerForPushNotificationsAsync();

      if (result.token) {
        setExpoPushToken(result.token);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, result.token);

        // Send token to backend
        const success = await sendTokenToBackend(result.token);
        setIsRegistered(success);
        await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, success ? 'true' : 'false');

        if (!success) {
          setError('Failed to register with server');
        }
        updateDebugInfo(result.token, success, success ? null : 'Backend failed');
      } else {
        console.log('Push registration failed:', result.error);
        setError(result.error);
        updateDebugInfo(null, false, result.error);
      }
    } catch (err: any) {
      console.error('Error registering for notifications:', err);
      const errMsg = err?.message || 'Unknown error';
      setError(errMsg);
      updateDebugInfo(null, false, errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [updateDebugInfo]);

  // Unregister from push notifications
  const unregisterFromNotifications = useCallback(async () => {
    // Use stored token if state is empty
    const token = expoPushToken || await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token) {
      await removeTokenFromBackend(token);
    }
    setIsRegistered(false);
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'false');
    updateDebugInfo(token, false, null);
  }, [expoPushToken, updateDebugInfo]);

  // Load saved preference and setup listeners
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      // Load saved preference (default to true)
      const saved = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
      const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      const enabled = saved === null ? true : saved === 'true';

      setIsRegistered(enabled);
      if (savedToken) {
        setExpoPushToken(savedToken);
      }

      updateDebugInfo(savedToken, enabled, null);

      // Auto-register if enabled
      if (enabled) {
        registerForNotifications();
      }
    };

    init();

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
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
  }, [registerForNotifications, handleNotificationNavigation, updateDebugInfo]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    error,
    debugInfo,
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
