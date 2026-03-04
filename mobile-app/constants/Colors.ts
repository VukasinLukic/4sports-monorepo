const tintColorLight = '#0a7ea4';
const tintColorDark = '#1DDD63';

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
    text: '#FAFAFA',
    background: '#0A0A0A',
    tint: tintColorDark,
    icon: '#A3A3A3',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: tintColorDark,
  },
};

// Main app colors — matches web admin dark theme
export const Colors = {
  // Primary Colors (web: --primary: 142 77% 49%)
  primary: '#1DDD63',
  primaryDark: '#16AC4D',
  primaryLight: '#61EA93',

  // Secondary Colors
  secondary: '#ff9800',
  secondaryDark: '#f57c00',
  secondaryLight: '#ffb74d',

  // Background
  background: '#0A0A0A',
  surface: '#121212',
  card: '#121212',

  // Text (web: --foreground: 0 0% 98%, --muted-foreground: 0 0% 64%)
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textDisabled: '#666666',

  // Status Colors (web: --destructive: 0 84% 60%)
  success: '#1DDD63',
  error: '#EF4444',
  warning: '#ff9800',
  info: '#2196f3',

  // Attendance Status
  present: '#1DDD63',
  absent: '#EF4444',
  excused: '#ff9800',

  // Payment Status
  paid: '#1DDD63',
  unpaid: '#EF4444',
  partial: '#ff9800',

  // Medical Status
  valid: '#1DDD63',
  expired: '#EF4444',
  expiring: '#ff9800',

  // Event Types
  eventTraining: '#1DDD63',
  eventCompetition: '#ff9800',
  eventMeeting: '#2196f3',

  // UI Elements (web: --input: 0 0% 18% used as border)
  border: '#2E2E2E',
  divider: '#2E2E2E',
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Legacy alias for backward compatibility
export const AppColors = Colors;
