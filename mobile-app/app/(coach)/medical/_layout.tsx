import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function MedicalLayout() {
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
        name="record"
        options={{
          title: 'Record Medical Check',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
