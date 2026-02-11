import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
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
        name="edit"
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
