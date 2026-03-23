import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const TAB_BAR_BG = '#1a1a1a';
const ICON_SIZE = 26;
const ACTIVE_PILL_COLOR = Colors.primary;
const DOCK_BORDER_RADIUS = 32;
const DOCK_MARGIN_H = 20;
const DOCK_MARGIN_BOTTOM = 10;
const DOCK_HEIGHT = 68;

/** Returns the bottom value for FABs/buttons that need to sit above the tab bar */
export function getFabBottom(insetsBottom: number): number {
  const dockBottom = insetsBottom || DOCK_MARGIN_BOTTOM;
  return dockBottom + DOCK_HEIGHT + 10; // dock position + dock height + gap
}

function TabItem({
  route,
  isFocused,
  options,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const translateAnim = useRef(new Animated.Value(isFocused ? -20 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.spring(translateAnim, {
        toValue: isFocused ? -20 : 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [isFocused]);

  const icon = options.tabBarIcon;
  const badge = options.tabBarBadge;

  const animatedScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const animatedBg = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { translateY: translateAnim },
              { scale: animatedScale },
            ],
            backgroundColor: isFocused ? ACTIVE_PILL_COLOR : 'transparent',
            width: isFocused ? 60 : 48,
            height: isFocused ? 45 : 48,
            borderRadius: isFocused ? 16 : 16,
          },
          isFocused && styles.activeIconShadow,
        ]}
      >
        {icon && icon({
          focused: isFocused,
          color: '#FFFFFF',
          size: ICON_SIZE,
        })}
        {badge !== undefined && badge !== null && (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom || DOCK_MARGIN_BOTTOM;

  // Hide tab bar when inside a chat conversation (nested beyond index)
  const focusedRoute = state.routes[state.index];
  const nestedState = focusedRoute?.state;
  if (focusedRoute?.name === 'chat' && nestedState && nestedState.index !== undefined && nestedState.index > 0) {
    return null;
  }

  // Filter visible tabs - only those with an icon (hidden screens have href:null and no icon)
  const visibleTabs = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => {
      const { options } = descriptors[route.key];
      return !!options.tabBarIcon;
    });

  return (
    <View style={[styles.outerContainer, { bottom: bottomOffset }]}>
      <View style={styles.dock}>
        {visibleTabs.map(({ route, index }) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: DOCK_MARGIN_H,
    right: DOCK_MARGIN_H,
  },
  dock: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: TAB_BAR_BG,
    borderRadius: DOCK_BORDER_RADIUS,
    height: 68,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 68,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconShadow: {
    ...Platform.select({
      ios: {
        shadowColor: ACTIVE_PILL_COLOR,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,

      },
      android: {
        elevation: 10,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: TAB_BAR_BG,
  },
});
