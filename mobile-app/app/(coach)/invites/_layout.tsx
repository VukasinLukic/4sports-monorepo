import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function InvitesLayout() {
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
          title: 'Invite Codes',
        }}
      />
    </Stack>
  );
}
