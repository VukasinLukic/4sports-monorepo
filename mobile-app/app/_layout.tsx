import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { AppColors } from '@/constants/Colors';
import { AuthProvider } from '@/services/AuthContext';
import { LanguageProvider } from '@/services/LanguageContext';
import NetworkStatus from '@/components/NetworkStatus';
import { ToastProvider } from '@/components/Toast';

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
    background: AppColors.background,
    surface: AppColors.surface,
    error: AppColors.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: AppColors.text,
    onSurface: AppColors.text,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PaperProvider theme={theme}>
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
            </PaperProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
