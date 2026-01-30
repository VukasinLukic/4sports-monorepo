import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import TopHeader from '@/components/TopHeader';

export default function CoachLayout() {
  return (
    <>
      <TopHeader basePath="/(coach)" />
      <Tabs
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
            fontSize: 11,
            fontWeight: '500',
          },
          headerShown: false,
        }}
      >
        {/* Tab 1: Evidencija */}
        <Tabs.Screen
          name="evidence"
          options={{
            title: 'Evidencija',
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
            title: 'Kalendar',
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
          }}
        />

        {/* Tab 5: Grupe */}
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Grupe',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-group-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* Hidden screens - accessible via navigation but not in tab bar */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="medical"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="invites"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
