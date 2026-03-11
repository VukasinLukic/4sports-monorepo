import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/services/LanguageContext';

export default function ParentLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          headerTitle: t('profile.myChildren'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('navigation.scan'),
          headerTitle: t('qr.scanQR'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('navigation.calendar'),
          headerTitle: t('events.title'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t('navigation.news'),
          headerTitle: t('news.newsFeed'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          headerTitle: t('profile.title'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
      {/* Hide folder routes and secondary screens from tab bar */}
      <Tabs.Screen
        name="member"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
          headerTitle: t('payments.paymentHistory'),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          href: null,
          headerTitle: t('members.attendanceHistory'),
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
