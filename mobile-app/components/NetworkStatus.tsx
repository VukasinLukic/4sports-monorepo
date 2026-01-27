import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NetworkStatusProps {
  showSyncButton?: boolean;
}

export default function NetworkStatus({ showSyncButton = true }: NetworkStatusProps) {
  const { isOnline, isSyncing, pendingSyncCount, syncNow } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: !isOnline || pendingSyncCount > 0 ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, pendingSyncCount, slideAnim]);

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isOnline ? Colors.warning : Colors.error,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={isOnline ? 'cloud-sync' : 'wifi-off'}
          size={20}
          color={Colors.text}
        />
        <Text style={styles.text}>
          {!isOnline
            ? 'You are offline'
            : isSyncing
            ? 'Syncing data...'
            : `${pendingSyncCount} item${pendingSyncCount > 1 ? 's' : ''} pending sync`}
        </Text>

        {isOnline && pendingSyncCount > 0 && showSyncButton && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={syncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Text style={styles.syncText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// Compact version for inline use
export function NetworkStatusBadge() {
  const { isOnline, pendingSyncCount } = useNetworkStatus();

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isOnline ? Colors.warning : Colors.error },
      ]}
    >
      <MaterialCommunityIcons
        name={isOnline ? 'cloud-sync' : 'wifi-off'}
        size={14}
        color={Colors.text}
      />
      <Text style={styles.badgeText}>
        {!isOnline ? 'Offline' : `${pendingSyncCount} pending`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  syncText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
  },
});
