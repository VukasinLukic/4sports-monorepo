import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function MemberEventsLayout() {
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
        name="index"
        options={{
          title: 'Events',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Event Details',
        }}
      />
    </Stack>
  );
}
