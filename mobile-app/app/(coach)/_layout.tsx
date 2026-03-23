import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import TopHeader from '@/components/TopHeader';
import CustomTabBar from '@/components/CustomTabBar';
import { useChat } from '@/services/ChatContext';
import { useLanguage } from '@/services/LanguageContext';

export default function CoachLayout() {
  const { totalUnreadCount } = useChat();
  const { t } = useLanguage();

  return (
    <>
      <TopHeader basePath="/(coach)" />
      <Tabs
        initialRouteName="index"
        backBehavior="initialRoute"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Tab 1: Evidencija */}
        <Tabs.Screen
          name="evidence"
          options={{
            title: t('navigation.evidence'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 2: Kalendar */}
        <Tabs.Screen
          name="calendar"
          options={{
            title: t('navigation.calendar'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="calendar-month"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Tab 3: Home (center) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />

        {/* Tab 4: Chat */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="message-outline"
                size={size}
                color={color}
              />
            ),
            tabBarBadge: totalUnreadCount > 0 ? (totalUnreadCount > 99 ? '99+' : totalUnreadCount) : undefined,
          }}
        />

        {/* Tab 5: Grupe */}
        <Tabs.Screen
          name="groups"
          options={{
            title: t('navigation.groups'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-group-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="members" options={{ href: null }} />
        <Tabs.Screen name="news" options={{ href: null }} />
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="events" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="medical" options={{ href: null }} />
        <Tabs.Screen name="invites" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="club" options={{ href: null }} />
        <Tabs.Screen name="users" options={{ href: null }} />
      </Tabs>
    </>
  );
}
