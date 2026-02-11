import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are available
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light haptic feedback - for subtle interactions
 * Use for: selection changes, toggles, minor actions
 */
export function lightHaptic() {
  if (isHapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Medium haptic feedback - for standard interactions
 * Use for: button presses, card taps, navigation
 */
export function mediumHaptic() {
  if (isHapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/**
 * Heavy haptic feedback - for significant actions
 * Use for: confirmations, deletions, important changes
 */
export function heavyHaptic() {
  if (isHapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/**
 * Selection haptic feedback
 * Use for: picker selections, list item selections
 */
export function selectionHaptic() {
  if (isHapticsAvailable) {
    Haptics.selectionAsync();
  }
}

/**
 * Success haptic feedback
 * Use for: successful actions, confirmations, completions
 */
export function successHaptic() {
  if (isHapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * Warning haptic feedback
 * Use for: warnings, important notices requiring attention
 */
export function warningHaptic() {
  if (isHapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/**
 * Error haptic feedback
 * Use for: errors, failed actions, invalid input
 */
export function errorHaptic() {
  if (isHapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

// Preset haptic patterns for common use cases
export const HapticPatterns = {
  // QR code scanned successfully
  qrCodeScanned: () => {
    successHaptic();
  },

  // Attendance recorded
  attendanceRecorded: () => {
    successHaptic();
  },

  // Button pressed
  buttonPress: () => {
    lightHaptic();
  },

  // Tab changed
  tabChanged: () => {
    selectionHaptic();
  },

  // Pull to refresh triggered
  pullToRefresh: () => {
    mediumHaptic();
  },

  // Item deleted
  itemDeleted: () => {
    heavyHaptic();
  },

  // Form submitted
  formSubmitted: () => {
    mediumHaptic();
  },

  // Error occurred
  error: () => {
    errorHaptic();
  },

  // Warning shown
  warning: () => {
    warningHaptic();
  },

  // Toggle switched
  toggleSwitch: () => {
    lightHaptic();
  },

  // Long press detected
  longPress: () => {
    mediumHaptic();
  },

  // Navigation action
  navigate: () => {
    selectionHaptic();
  },
};

export default {
  light: lightHaptic,
  medium: mediumHaptic,
  heavy: heavyHaptic,
  selection: selectionHaptic,
  success: successHaptic,
  warning: warningHaptic,
  error: errorHaptic,
  patterns: HapticPatterns,
};
