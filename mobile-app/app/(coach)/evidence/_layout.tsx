import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function EvidenceLayout() {
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
          title: 'Evidence',
        }}
      />
    </Stack>
  );
}
