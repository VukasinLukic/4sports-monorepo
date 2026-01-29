import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import { useMembers, useRecordMedical } from '@/hooks/useMembers';

export default function RecordMedicalScreen() {
  const { t } = useLanguage();
  const { memberId, memberName } = useLocalSearchParams<{ memberId?: string; memberName?: string }>();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(memberId || '');
  const [examinationDate, setExaminationDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: members = [], isLoading: isLoadingMembers } = useMembers();
  const { mutate: recordMedical, isPending: isSubmitting } = useRecordMedical();

  // Find selected member
  const selectedMember = members.find(m => m._id === selectedMemberId);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExaminationDate(selectedDate);
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    recordMedical(
      {
        memberId: selectedMemberId,
        examinationDate: formatDate(examinationDate),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('medical.recordedSuccess') || 'Medical check recorded successfully!', [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            t('common.error'),
            error.response?.data?.message || t('medical.recordFailed') || 'Failed to record medical check. Please try again.'
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
            <Text style={styles.memberName}>{t('medical.recordingFor') || 'Recording medical check for:'} {memberName}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <MaterialCommunityIcons name="information" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            {t('medical.validityInfo') || 'Medical checks are valid for 6 months from the examination date. The system will automatically track expiration.'}
          </Text>
        </Card.Content>
      </Card>

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

      {/* Examination Date */}
      <Text style={styles.label}>{t('medical.examinationDate')} *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
        icon="calendar"
        textColor={Colors.text}
      >
        {examinationDate.toLocaleDateString()}
      </Button>
      {showDatePicker && (
        <DateTimePicker
          value={examinationDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Calculated Expiry Date */}
      <Card style={styles.expiryCard}>
        <Card.Content style={styles.expiryContent}>
          <View style={styles.expiryRow}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.info} />
            <Text style={styles.expiryLabel}>{t('medical.expiryDate')}:</Text>
          </View>
          <Text style={styles.expiryDate}>
            {new Date(examinationDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </Text>
          <Text style={styles.expiryNote}>
            ({t('medical.sixMonthsFromExam') || '6 months from examination date'})
          </Text>
        </Card.Content>
      </Card>

      {/* Note */}
      <Text style={styles.label}>{t('common.note')} ({t('common.optional')})</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('medical.notePlaceholder') || 'e.g., Regular checkup, all clear'}
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
        buttonColor={Colors.info}
      >
        {t('medical.recordMedical')}
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
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.info + '10',
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
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
  dateButton: {
    borderColor: Colors.border,
    justifyContent: 'flex-start',
  },
  expiryCard: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  expiryContent: {
    alignItems: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  expiryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  expiryDate: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.info,
  },
  expiryNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
