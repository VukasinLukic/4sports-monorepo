import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/services/LanguageContext';

export default function PaymentsLayout() {
  const { t } = useLanguage();

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
          title: t('payments.recordPayment'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
