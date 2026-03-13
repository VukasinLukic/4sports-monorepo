import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { SafeAreaProvider, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as NavigationBar from 'expo-navigation-bar';
import { AppColors } from '@/constants/Colors';
import { AuthProvider } from '@/services/AuthContext';
import { ChatProvider } from '@/services/ChatContext';
import { LanguageProvider } from '@/services/LanguageContext';
import { NotificationBadgeProvider } from '@/services/NotificationBadgeContext';
import NetworkStatus from '@/components/NetworkStatus';
import { ToastProvider } from '@/components/Toast';
import { AlertProvider } from '@/contexts/AlertContext';

/**
 * Freezes safe area insets after initial measurement to prevent layout shifts
 * when the app returns from background (Android recalculates window insets on resume).
 */
function StableInsetsProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const frozen = useRef(insets);
  // Update only if going from zero → real values (initial measurement)
  if (frozen.current.top === 0 && frozen.current.bottom === 0 && (insets.top > 0 || insets.bottom > 0)) {
    frozen.current = insets;
  }
  return (
    <SafeAreaInsetsContext.Provider value={frozen.current}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

// Setup online manager for React Query
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Create a query client instance with offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes for offline caching
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// Custom theme based on app colors
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    background: AppColors.background,        // screen bg → #0A0A0A
    surface: AppColors.card,                  // base surface → #121212
    surfaceVariant: AppColors.surface,        // variant surface → #1F1F1F
    // MD3 elevation container tokens — everything → #121212 except screen bg
    surfaceContainerLowest: AppColors.background, // #0A0A0A
    surfaceContainerLow: AppColors.card,          // #121212
    surfaceContainer: AppColors.card,             // #121212
    surfaceContainerHigh: AppColors.card,         // #121212
    surfaceContainerHighest: AppColors.card,      // #121212
    error: AppColors.error,
    onPrimary: '#000000',
    onSecondary: '#ffffff',
    onBackground: AppColors.text,
    onSurface: AppColors.text,
    onSurfaceVariant: AppColors.textSecondary,
  },
};

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StableInsetsProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationBadgeProvider>
            <ChatProvider>
              <PaperProvider theme={theme}>
                <AlertProvider>
                  <ToastProvider>
                  <View style={{ flex: 1, backgroundColor: AppColors.background }}>
                    <StatusBar style="light" backgroundColor={AppColors.background} />
                    <NetworkStatus />
                    <Stack
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: AppColors.background,
                        },
                        headerTintColor: AppColors.text,
                        headerTitleStyle: {
                          fontWeight: 'bold',
                        },
                        contentStyle: {
                          backgroundColor: AppColors.background,
                        },
                      }}
                    >
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(coach)" options={{ headerShown: false }} />
                      <Stack.Screen name="(parent)" options={{ headerShown: false }} />
                      <Stack.Screen name="(member)" options={{ headerShown: false }} />
                      <Stack.Screen name="profile" options={{ headerShown: false }} />
                    </Stack>
                  </View>
                </ToastProvider>
                </AlertProvider>
              </PaperProvider>
            </ChatProvider>
            </NotificationBadgeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </StableInsetsProvider>
    </SafeAreaProvider>
  );
}
