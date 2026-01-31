import { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useMembers, useMember, useRecordPayment, useMemberPayments } from '@/hooks/useMembers';
import { PaymentMethod, Payment } from '@/types';

const MONTHS_SR = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export default function RecordPaymentScreen() {
  const { t, language } = useLanguage();
  const { memberId, memberName } = useLocalSearchParams<{ memberId?: string; memberName?: string }>();

  const months = language === 'sr' ? MONTHS_SR : MONTHS_EN;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(memberId || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [note, setNote] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { data: member } = useMember(selectedMemberId || memberId);
  const { data: memberPayments = [] } = useMemberPayments(selectedMemberId || memberId);
  const { mutate: recordPayment, isPending: isSubmitting } = useRecordPayment();

  // Get the member's join date (earliest from clubs array or createdAt)
  const memberJoinDate = useMemo(() => {
    if (!member) return null;

    // Check clubs array for joinedAt dates
    if (member.clubs && member.clubs.length > 0) {
      const joinDates = member.clubs
        .map(c => c.joinedAt ? new Date(c.joinedAt) : null)
        .filter((d): d is Date => d !== null);

      if (joinDates.length > 0) {
        return new Date(Math.min(...joinDates.map(d => d.getTime())));
      }
    }

    // Fallback to createdAt
    if (member.createdAt) {
      return new Date(member.createdAt);
    }

    return null;
  }, [member]);

  // Get months with payment status (only months since member joined)
  const monthOptions = useMemo(() => {
    const options: { month: number; year: number; label: string; status: PaymentStatus }[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      // Skip months before member joined
      if (memberJoinDate) {
        const monthStart = new Date(year, month, 1);
        const joinMonth = new Date(memberJoinDate.getFullYear(), memberJoinDate.getMonth(), 1);
        if (monthStart < joinMonth) {
          continue;
        }
      }

      // Get all payments for this month
      const monthPayments = memberPayments.filter((p: Payment) =>
        p.period?.month === month + 1 && p.period?.year === year
      );

      // Determine payment status
      let status: PaymentStatus = 'unpaid';
      if (monthPayments.length > 0) {
        const allPaid = monthPayments.every((p: Payment) => p.status === 'PAID');
        const somePaid = monthPayments.some((p: Payment) => p.status === 'PAID');

        if (allPaid) {
          status = 'paid';
        } else if (somePaid || monthPayments.some((p: Payment) => p.status === 'PENDING' || p.status === 'OVERDUE')) {
          status = 'partial';
        }
      }

      options.push({
        month,
        year,
        label: `${months[month]} ${year}`,
        status,
      });
    }

    return options;
  }, [memberPayments, months, currentMonth, currentYear, memberJoinDate]);

  const selectedMonthLabel = `${months[selectedMonth]} ${selectedYear}`;

  const validateForm = (): boolean => {
    if (!selectedMemberId) {
      Alert.alert(t('common.error'), t('validation.selectMember') || 'Please select a member.');
      return false;
    }
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert(t('common.error'), t('validation.validAmount') || 'Please enter a valid amount.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    recordPayment(
      {
        memberId: selectedMemberId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        note: note.trim() || `${months[selectedMonth]} ${selectedYear}`,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('payments.recordedSuccess') || 'Payment recorded successfully!', [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            t('common.error'),
            error.response?.data?.message || t('payments.recordFailed') || 'Failed to record payment. Please try again.'
          );
        },
      }
    );
  };

  if (isLoadingMembers) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Member Name Header - icon + name left, month selector right */}
      {memberName && (
        <View style={styles.memberHeader}>
          <View style={styles.memberNameRow}>
            <MaterialCommunityIcons name="account" size={20} color={Colors.primary} />
            <Text style={styles.memberNameHeader}>{memberName}</Text>
          </View>
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Text style={styles.monthText}>{selectedMonthLabel}</Text>
            <MaterialCommunityIcons
              name={showMonthPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <Card style={styles.monthPickerCard}>
          <ScrollView style={styles.monthPickerScroll} nestedScrollEnabled>
            {monthOptions.map((option) => (
              <TouchableOpacity
                key={`${option.year}-${option.month}`}
                style={[
                  styles.monthOption,
                  selectedMonth === option.month && selectedYear === option.year && styles.monthOptionSelected,
                ]}
                onPress={() => {
                  setSelectedMonth(option.month);
                  setSelectedYear(option.year);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[
                  styles.monthOptionText,
                  selectedMonth === option.month && selectedYear === option.year && styles.monthOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {option.status === 'paid' ? (
                  <View style={styles.paidBadge}>
                    <MaterialCommunityIcons name="check" size={12} color={Colors.success} />
                    <Text style={styles.paidText}>{t('payments.paid')}</Text>
                  </View>
                ) : option.status === 'partial' ? (
                  <View style={styles.partialBadge}>
                    <MaterialCommunityIcons name="circle-half-full" size={12} color={Colors.warning} />
                    <Text style={styles.partialText}>{t('payments.partial')}</Text>
                  </View>
                ) : (
                  <View style={styles.unpaidBadge}>
                    <Text style={styles.unpaidText}>{t('payments.unpaid')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Member Selection (if not pre-selected) */}
      {!memberId && (
        <>
          <Text style={styles.label}>{t('members.selectMember')} *</Text>
          {members.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="account-group-outline" size={24} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>{t('members.noMembers') || 'No members available'}</Text>
              </Card.Content>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
              <View style={styles.memberSelector}>
                {members.map(member => (
                  <Button
                    key={member._id}
                    mode={selectedMemberId === member._id ? 'contained' : 'outlined'}
                    onPress={() => setSelectedMemberId(member._id)}
                    style={styles.memberButton}
                    buttonColor={selectedMemberId === member._id ? Colors.primary : undefined}
                    textColor={selectedMemberId === member._id ? Colors.text : Colors.primary}
                    compact
                  >
                    {member.fullName}
                  </Button>
                ))}
              </View>
            </ScrollView>
          )}
        </>
      )}

      {/* Amount */}
      <Text style={styles.label}>{t('payments.amount')} *</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder={t('payments.enterAmount') || 'Enter amount'}
        mode="outlined"
        keyboardType="decimal-pad"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
        right={<TextInput.Affix text="RSD" textStyle={styles.currencyAffix} />}
      />

      {/* Payment Method Toggle */}
      <Text style={styles.label}>{t('payments.method')} *</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            paymentMethod === PaymentMethod.CASH && styles.toggleButtonActive,
          ]}
          onPress={() => setPaymentMethod(PaymentMethod.CASH)}
        >
          <MaterialCommunityIcons
            name="cash"
            size={20}
            color={paymentMethod === PaymentMethod.CASH ? '#fff' : Colors.textSecondary}
          />
          <Text style={[
            styles.toggleButtonText,
            paymentMethod === PaymentMethod.CASH && styles.toggleButtonTextActive,
          ]}>
            {t('payments.cash')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            paymentMethod === PaymentMethod.BANK_TRANSFER && styles.toggleButtonActive,
          ]}
          onPress={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
        >
          <MaterialCommunityIcons
            name="bank"
            size={20}
            color={paymentMethod === PaymentMethod.BANK_TRANSFER ? '#fff' : Colors.textSecondary}
          />
          <Text style={[
            styles.toggleButtonText,
            paymentMethod === PaymentMethod.BANK_TRANSFER && styles.toggleButtonTextActive,
          ]}>
            {t('payments.bankTransfer')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note */}
      <Text style={styles.label}>{t('common.note')} ({t('common.optional')})</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('payments.notePlaceholder') || 'e.g., Monthly fee for January'}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting || !selectedMemberId}
        style={styles.submitButton}
        icon="check"
        buttonColor={Colors.success}
      >
        {t('payments.recordPayment')}
      </Button>

      {/* Cancel Button */}
      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        {t('common.cancel')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
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
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberNameHeader: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  monthText: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: '600',
  },
  monthPickerCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    maxHeight: 250,
  },
  monthPickerScroll: {
    padding: Spacing.sm,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  monthOptionSelected: {
    backgroundColor: Colors.primary + '20',
  },
  monthOptionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  monthOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '500',
  },
  partialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  partialText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '500',
  },
  unpaidBadge: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  unpaidText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  memberScroll: {
    maxHeight: 50,
  },
  memberSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  memberButton: {
    marginRight: Spacing.xs,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  currencyAffix: {
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  textArea: {
    minHeight: 80,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButtonLeft: {
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    borderRightWidth: 0,
  },
  toggleButtonRight: {
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  toggleButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
});
