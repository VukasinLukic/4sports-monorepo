import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'card' | 'minimal';
}

export default function EmptyState({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <>
      <MaterialCommunityIcons
        name={icon}
        size={variant === 'minimal' ? 48 : 64}
        color={Colors.textSecondary}
      />
      <Text style={[styles.title, variant === 'minimal' && styles.titleMinimal]}>
        {title}
      </Text>
      {message && (
        <Text style={[styles.message, variant === 'minimal' && styles.messageMinimal]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.actionButton}
          buttonColor={Colors.primary}
        >
          {actionLabel}
        </Button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <Button
          mode="text"
          onPress={onSecondaryAction}
          style={styles.secondaryButton}
          textColor={Colors.primary}
        >
          {secondaryActionLabel}
        </Button>
      )}
    </>
  );

  if (variant === 'card') {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>{content}</Card.Content>
      </Card>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

// Preset empty states for common scenarios
export function NoMembersEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="account-group-outline"
      title="No Members Yet"
      message="Members will appear here once parents register with your club's invite code"
      actionLabel={onAction ? 'Generate Invite Code' : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoEventsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="calendar-blank-outline"
      title="No Events Scheduled"
      message="Create your first event to get started"
      actionLabel={onAction ? 'Create Event' : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoPostsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="newspaper-variant-outline"
      title="No Posts Yet"
      message="Share news and updates with your club members"
      actionLabel={onAction ? 'Create Post' : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoChildrenEmpty() {
  return (
    <EmptyState
      icon="account-child-outline"
      title="No Children Registered"
      message="Your children will appear here once they are registered with a club"
      variant="card"
    />
  );
}

export function NoResultsEmpty({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="magnify"
      title="No Results Found"
      message="Try adjusting your search or filter criteria"
      actionLabel={onClear ? 'Clear Filters' : undefined}
      onAction={onClear}
      variant="card"
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Something Went Wrong"
      message={message || 'An error occurred while loading data'}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
      variant="card"
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="wifi-off"
      title="You're Offline"
      message="Check your internet connection and try again"
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
      variant="card"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  titleMinimal: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  messageMinimal: {
    fontSize: FontSize.xs,
  },
  actionButton: {
    marginTop: Spacing.lg,
  },
  secondaryButton: {
    marginTop: Spacing.sm,
  },
});
