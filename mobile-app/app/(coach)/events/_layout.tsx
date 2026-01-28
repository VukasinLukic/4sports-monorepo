import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Event',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Event Details',
        }}
      />
      <Stack.Screen
        name="qr"
        options={{
          title: 'QR Code',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Event',
        }}
      />
    </Stack>
  );
}
