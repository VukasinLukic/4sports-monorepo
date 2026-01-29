import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useMembers, useRecordPayment } from '@/hooks/useMembers';
import { Member, PaymentMethod } from '@/types';

export default function RecordPaymentScreen() {
  const { t } = useLanguage();
  const { memberId, memberName } = useLocalSearchParams<{ memberId?: string; memberName?: string }>();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(memberId || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { mutate: recordPayment, isPending: isSubmitting } = useRecordPayment();

  // Find selected member
  const selectedMember = members.find(m => m._id === selectedMemberId);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

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
        paymentDate: formatDate(paymentDate),
        note: note.trim() || undefined,
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
      {/* Pre-selected Member Info */}
      {memberName && (
        <Card style={styles.memberCard}>
          <Card.Content style={styles.memberContent}>
            <MaterialCommunityIcons name="account" size={24} color={Colors.primary} />
            <Text style={styles.memberName}>{t('payments.recordingFor') || 'Recording payment for:'} {memberName}</Text>
          </Card.Content>
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
        left={<TextInput.Icon icon="currency-eur" />}
      />

      {/* Payment Method */}
      <Text style={styles.label}>{t('payments.method')} *</Text>
      <SegmentedButtons
        value={paymentMethod}
        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
        buttons={[
          { value: PaymentMethod.CASH, label: t('payments.cash'), icon: 'cash' },
          { value: PaymentMethod.BANK_TRANSFER, label: t('payments.bank'), icon: 'bank' },
          { value: PaymentMethod.CARD, label: t('payments.card'), icon: 'credit-card' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Payment Date */}
      <Text style={styles.label}>{t('payments.date')} *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
        icon="calendar"
        textColor={Colors.text}
      >
        {paymentDate.toLocaleDateString()}
      </Button>
      {showDatePicker && (
        <DateTimePicker
          value={paymentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

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
  memberCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
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
  textArea: {
    minHeight: 80,
  },
  segmentedButtons: {
    marginBottom: Spacing.sm,
  },
  dateButton: {
    borderColor: Colors.border,
    justifyContent: 'flex-start',
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
