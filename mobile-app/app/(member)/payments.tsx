import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

interface Payment {
  _id: string;
  memberId: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  period?: {
    month: number;
    year: number;
  };
}

type FilterType = 'all' | 'paid' | 'pending' | 'overdue';

export default function MemberPayments() {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchPayments = useCallback(async () => {
    try {
      const response = await api.get('/payments/me');
      const paymentsData = response.data.data || [];
      // Sort by date (newest first)
      paymentsData.sort((a: Payment, b: Payment) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPayments();
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.status === 'PAID';
    if (filter === 'pending') return payment.status === 'PENDING';
    if (filter === 'overdue') return payment.status === 'OVERDUE';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return Colors.success;
      case 'PENDING':
        return Colors.warning;
      case 'OVERDUE':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPeriod = (period?: { month: number; year: number }) => {
    if (!period) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[period.month - 1]} ${period.year}`;
  };

  // Calculate summary
  const summary = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter((p) => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0),
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Card style={styles.paymentCard}>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <View>
            <Text style={styles.paymentType}>{item.type}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="cash" size={16} color={Colors.textSecondary} />
            <Text style={styles.amount}>{item.amount.toLocaleString()} RSD</Text>
          </View>

          {item.period && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-month" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{t('payments.period')}: {formatPeriod(item.period)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{t('payments.due')}: {formatDate(item.dueDate)}</Text>
          </View>

          {item.paidDate && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
              <Text style={[styles.detailText, { color: Colors.success }]}>
                {t('payments.paidOn')}: {formatDate(item.paidDate)}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('payments.loading') || 'Loading payments...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>{t('payments.summary')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryAmount, { color: Colors.success }]}>
                {summary.paid.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>{t('status.paid')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryAmount, { color: Colors.warning }]}>
                {summary.pending.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>{t('status.pending')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryAmount, { color: Colors.error }]}>
                {summary.overdue.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>{t('status.overdue')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Filter */}
      <SegmentedButtons
        value={filter}
        onValueChange={(value) => setFilter(value as FilterType)}
        buttons={[
          { value: 'all', label: t('common.all') },
          { value: 'paid', label: t('status.paid') },
          { value: 'pending', label: t('status.pending') },
          { value: 'overdue', label: t('status.overdue') },
        ]}
        style={styles.filter}
      />

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="cash-remove" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('payments.noPayments') || 'No payments found'}</Text>
            </Card.Content>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryAmount: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  filter: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  paymentCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  paymentType: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  paymentDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
