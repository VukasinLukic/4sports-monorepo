import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function MembersLayout() {
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
        name="index"
        options={{
          title: 'Members',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Member Details',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Member',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
