import { Stack } from 'expo-router';
import { AppColors } from '@/constants';

export default function AuthLayout() {
  return (
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
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="invite-code" options={{ headerShown: false }} />
    </Stack>
  );
}
