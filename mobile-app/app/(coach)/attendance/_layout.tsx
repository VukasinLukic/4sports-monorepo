import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AttendanceLayout() {
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
        name="[id]"
        options={{
          title: 'Event Attendance',
        }}
      />
      <Stack.Screen
        name="manual-add"
        options={{
          title: 'Mark Attendance',
        }}
      />
    </Stack>
  );
}
