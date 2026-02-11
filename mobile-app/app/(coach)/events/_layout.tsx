import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="qr"
        options={{
          headerShown: true,
          title: 'QR Kod',
          presentation: 'modal',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
