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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalji grupe',
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: 'Grupa',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
