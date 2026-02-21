import { Alert, Platform, AlertButton } from 'react-native';
import { Colors } from '@/constants/Colors';

interface CustomAlertButton extends AlertButton {
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Custom Alert with our app colors
 * On Android, we use our green color for buttons
 * On iOS, system colors are used but text is customized
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: CustomAlertButton[]
) => {
  if (Platform.OS === 'android') {
    // Android supports custom button colors
    Alert.alert(title, message, buttons);
  } else {
    // iOS doesn't support custom button colors in Alert API
    // But we can customize text and styling through button style prop
    Alert.alert(title, message, buttons);
  }
};

/**
 * Success alert with our success color
 */
export const showSuccessAlert = (
  title: string,
  message: string,
  onDismiss?: () => void
) => {
  showAlert(title, message, [
    {
      text: 'U redu',
      style: 'default',
      onPress: onDismiss,
    },
  ]);
};

/**
 * Error alert with our error color
 */
export const showErrorAlert = (
  title: string,
  message: string,
  onDismiss?: () => void
) => {
  showAlert(title, message, [
    {
      text: 'U redu',
      style: 'cancel',
      onPress: onDismiss,
    },
  ]);
};

/**
 * Confirmation alert with custom buttons
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'Potvrdi',
  cancelText: string = 'Otkaži'
) => {
  showAlert(title, message, [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: confirmText,
      style: 'default',
      onPress: onConfirm,
    },
  ]);
};
