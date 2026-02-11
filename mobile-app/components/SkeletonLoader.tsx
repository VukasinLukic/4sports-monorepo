import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Layout';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Base Skeleton component with shimmer animation
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardRow}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={styles.cardContent}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={12} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

// Member Card Skeleton
export function MemberCardSkeleton() {
  return (
    <View style={styles.memberCardContainer}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.memberCardContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
        <View style={styles.badgeRow}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={60} height={20} borderRadius={10} />
        </View>
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

// Event Card Skeleton
export function EventCardSkeleton() {
  return (
    <View style={styles.eventCardContainer}>
      <View style={styles.eventDate}>
        <Skeleton width={40} height={24} />
        <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.eventContent}>
        <Skeleton width={60} height={18} borderRadius={9} />
        <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Post Card Skeleton
export function PostCardSkeleton() {
  return (
    <View style={styles.postCardContainer}>
      <View style={styles.postHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.postHeaderContent}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="20%" height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width="90%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={200} style={{ marginTop: 12 }} borderRadius={BorderRadius.md} />
      <View style={styles.postActions}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <View style={styles.statsCardContainer}>
      <Skeleton width={24} height={24} borderRadius={12} />
      <Skeleton width={40} height={24} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

// Calendar Skeleton
export function CalendarSkeleton() {
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={120} height={20} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.calendarWeekHeader}>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} width={30} height={14} />
        ))}
      </View>
      {[...Array(5)].map((_, week) => (
        <View key={week} style={styles.calendarWeek}>
          {[...Array(7)].map((_, day) => (
            <Skeleton key={day} width={36} height={36} borderRadius={18} />
          ))}
        </View>
      ))}
    </View>
  );
}

// List Skeleton
export function ListSkeleton({ count = 3, ItemSkeleton = CardSkeleton }: { count?: number; ItemSkeleton?: React.ComponentType }) {
  return (
    <View>
      {[...Array(count)].map((_, index) => (
        <ItemSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surface,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberCardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  eventCardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
  },
  eventDate: {
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  eventContent: {
    flex: 1,
  },
  postCardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  statsCardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
});
