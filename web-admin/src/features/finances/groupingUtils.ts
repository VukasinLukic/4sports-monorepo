import { FinanceEntry, Group, GroupedTransactionData } from '@/types';

/**
 * Group transactions by month (YYYY-MM format)
 */
export const groupTransactionsByMonth = (
  transactions: FinanceEntry[],
  monthNames?: string[]
): GroupedTransactionData[] => {
  const groupMap = new Map<string, FinanceEntry[]>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(transaction);
  });

  // Default month names in English (fallback)
  const defaultMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const names = monthNames || defaultMonthNames;

  // Convert to array and sort by month desc
  return Array.from(groupMap.entries())
    .map(([key, txns]) => {
      const [year, month] = key.split('-');

      return {
        key,
        name: `${names[parseInt(month) - 1]} ${year}`,
        transactions: txns,
        stats: calculateGroupStats(txns),
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
};

/**
 * Group transactions by training group
 */
export const groupTransactionsByGroup = (
  transactions: FinanceEntry[],
  groups: Group[]
): GroupedTransactionData[] => {
  const groupMap = new Map<string, FinanceEntry[]>();
  const groupNameMap = new Map<string, string>();

  // Build group name map
  groups.forEach((group) => {
    groupNameMap.set(group._id, group.name);
  });

  transactions.forEach((transaction) => {
    const groupId = transaction.groupId || 'NO_GROUP';

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId)!.push(transaction);
  });

  return Array.from(groupMap.entries()).map(([groupId, txns]) => ({
    key: groupId,
    name: groupNameMap.get(groupId) || 'No Group',
    transactions: txns,
    stats: calculateGroupStats(txns),
  }));
};

/**
 * Group transactions by category
 */
export const groupTransactionsByCategory = (
  transactions: FinanceEntry[],
  categoryTranslations?: Record<string, string>
): GroupedTransactionData[] => {
  const groupMap = new Map<string, FinanceEntry[]>();

  transactions.forEach((transaction) => {
    const category = transaction.category;

    if (!groupMap.has(category)) {
      groupMap.set(category, []);
    }
    groupMap.get(category)!.push(transaction);
  });

  return Array.from(groupMap.entries()).map(([category, txns]) => ({
    key: category,
    name: categoryTranslations?.[category] || category.replace(/_/g, ' '),
    transactions: txns,
    stats: calculateGroupStats(txns),
  }));
};

/**
 * Group transactions by coach (includes all transactions from groups they train)
 */
export const groupTransactionsByCoach = (
  transactions: FinanceEntry[],
  coachGroups: Record<string, Group[]>,
  coaches?: any[]
): GroupedTransactionData[] => {
  const coachMap = new Map<string, FinanceEntry[]>();

  // For each coach, collect all transactions from their groups
  Object.entries(coachGroups).forEach(([coachId, groups]) => {
    const coachTransactions: FinanceEntry[] = [];
    const groupIds = groups.map((g) => g._id);

    transactions.forEach((transaction) => {
      const txGroupId = transaction.groupId;
      if (txGroupId && groupIds.includes(txGroupId)) {
        coachTransactions.push(transaction);
      }
    });

    if (coachTransactions.length > 0) {
      coachMap.set(coachId, coachTransactions);
    }
  });

  return Array.from(coachMap.entries()).map(([coachId, txns]) => {
    const assignedGroups = coachGroups[coachId] || [];
    const groupNames = assignedGroups.map((g: Group) => g.name).join(', ');

    // Find coach name
    const coach = coaches?.find((c) => c.id === coachId);
    const coachName = coach?.fullName || 'Unknown Coach';

    return {
      key: coachId,
      name: `${coachName} (${groupNames})`,
      transactions: txns,
      stats: calculateGroupStats(txns),
    };
  });
};

/**
 * Calculate aggregate stats for a group of transactions
 */
export const calculateGroupStats = (
  transactions: FinanceEntry[]
): {
  count: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
} => {
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    count: transactions.length,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
  };
};
