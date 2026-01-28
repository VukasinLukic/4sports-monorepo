import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Groups',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Group Details',
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: 'Group',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
