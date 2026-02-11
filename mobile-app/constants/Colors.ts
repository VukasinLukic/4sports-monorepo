const tintColorLight = '#0a7ea4';
const tintColorDark = '#4caf50';

// Theme-based colors (for potential light/dark mode support)
export const ThemeColors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Main app colors (dark theme)
export const Colors = {
  // Primary Colors (Sports Green Theme)
  primary: '#4caf50',
  primaryDark: '#388e3c',
  primaryLight: '#81c784',

  // Secondary Colors
  secondary: '#ff9800',
  secondaryDark: '#f57c00',
  secondaryLight: '#ffb74d',

  // Background
  background: '#1a1a1a',
  surface: '#2d2d2d',
  card: '#3a3a3a',

  // Text
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textDisabled: '#757575',

  // Status Colors
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',

  // Attendance Status
  present: '#4caf50',
  absent: '#f44336',
  excused: '#ff9800',

  // Payment Status
  paid: '#4caf50',
  unpaid: '#f44336',
  partial: '#ff9800',

  // Medical Status
  valid: '#4caf50',
  expired: '#f44336',
  expiring: '#ff9800',

  // Event Types
  eventTraining: '#4caf50',
  eventCompetition: '#ff9800',
  eventMeeting: '#2196f3',

  // UI Elements
  border: '#424242',
  divider: '#424242',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Legacy alias for backward compatibility
export const AppColors = Colors;
