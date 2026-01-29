import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';

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
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="account-group-outline"
      title={t('empty.noMembers')}
      message={t('empty.noMembersDescription')}
      actionLabel={onAction ? t('invites.generateCode') : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoEventsEmpty({ onAction }: { onAction?: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="calendar-blank-outline"
      title={t('empty.noEvents')}
      message={t('empty.noEventsDescription')}
      actionLabel={onAction ? t('events.createEvent') : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoPostsEmpty({ onAction }: { onAction?: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="newspaper-variant-outline"
      title={t('empty.noNews')}
      message={t('empty.noNewsDescription')}
      actionLabel={onAction ? t('news.createPost') : undefined}
      onAction={onAction}
      variant="card"
    />
  );
}

export function NoChildrenEmpty() {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="account-child-outline"
      title={t('empty.noChildren')}
      message={t('empty.noChildrenDescription')}
      variant="card"
    />
  );
}

export function NoResultsEmpty({ onClear }: { onClear?: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="magnify"
      title={t('empty.noResults')}
      message={t('empty.noResultsDescription')}
      actionLabel={onClear ? t('common.filter') : undefined}
      onAction={onClear}
      variant="card"
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="alert-circle-outline"
      title={t('common.error')}
      message={message || t('errors.loadingFailed')}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
      variant="card"
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon="wifi-off"
      title={t('empty.offline')}
      message={t('empty.offlineDescription')}
      actionLabel={onRetry ? t('common.retry') : undefined}
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
