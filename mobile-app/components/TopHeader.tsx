import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/services/AuthContext';
import api from '@/services/api';

interface ClubInfo {
  _id: string;
  name: string;
  logo?: string;
}

interface TopHeaderProps {
  basePath: '/(coach)' | '/(member)' | '/(parent)';
}

export default function TopHeader({ basePath }: TopHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchClubInfo();
    fetchUnreadNotifications();
  }, [user?.clubId]);

  const fetchClubInfo = async () => {
    if (!user?.clubId) return;
    try {
      const response = await api.get(`/clubs/${user.clubId}`);
      setClubInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching club info:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data?.count || 0);
    } catch (error) {
      // Silently fail - notifications might not be set up
    }
  };

  const handleNotificationsPress = () => {
    router.push(`${basePath}/notifications` as any);
  };

  const handleProfilePress = () => {
    router.push(`${basePath}/profile` as any);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Left side - Club info */}
        <View style={styles.clubSection}>
          <View style={styles.clubIcon}>
            {clubInfo?.logo ? (
              <Image source={{ uri: clubInfo.logo }} style={styles.clubLogo} />
            ) : (
              <MaterialCommunityIcons
                name="shield-outline"
                size={24}
                color={Colors.primary}
              />
            )}
          </View>
          <Text style={styles.clubName} numberOfLines={1}>
            {clubInfo?.name || 'Loading...'}
          </Text>
        </View>

        {/* Right side - Icons */}
        <View style={styles.iconsSection}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationsPress}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={Colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleProfilePress}
          >
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitials}>
                  {getInitials(user?.fullName)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clubSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clubIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clubLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  iconsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
