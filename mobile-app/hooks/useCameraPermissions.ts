import { useState, useEffect, useCallback } from 'react';
import { Camera, PermissionResponse } from 'expo-camera';
import { Alert, Linking } from 'react-native';

interface CameraPermissionState {
  hasPermission: boolean | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
}

export function useCameraPermissions(): CameraPermissionState {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'To scan QR codes, please allow camera access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return {
    hasPermission,
    isLoading,
    requestPermission,
    openSettings,
  };
}
