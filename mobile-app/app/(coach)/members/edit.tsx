import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

export default function EditMemberScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [position, setPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [membershipFee, setMembershipFee] = useState('');

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const fetchMember = async () => {
    if (!memberId) return;
    try {
      const response = await api.get(`/members/${memberId}`);
      const member = response.data.data;
      setFullName(member.fullName || '');
      setDateOfBirth(member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '');
      setPosition(member.position || '');
      setJerseyNumber(member.jerseyNumber?.toString() || '');
      setHeight(member.height?.toString() || '');
      setWeight(member.weight?.toString() || '');
      setParentName(member.parentName || '');
      setParentPhone(member.parentPhone || '');
      setParentEmail(member.parentEmail || '');
      setMembershipFee(member.membershipFee?.toString() || '');
    } catch (error) {
      console.error('Error fetching member:', error);
      Alert.alert(t('common.error'), t('errors.loadingFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!memberId) return;
    setIsSaving(true);
    try {
      await api.put(`/members/${memberId}`, {
        fullName,
        dateOfBirth: dateOfBirth || undefined,
        position: position || undefined,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        parentEmail: parentEmail || undefined,
        membershipFee: membershipFee ? parseInt(membershipFee) : undefined,
      });
      Alert.alert(t('common.success'), t('profile.profileUpdated'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating member:', error);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>{t('members.memberDetails')}</Text>

      <TextInput
        label={t('auth.fullName')}
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <TextInput
        label={t('members.dateOfBirth')}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        mode="outlined"
        style={styles.input}
        placeholder="YYYY-MM-DD"
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <TextInput
        label={t('members.position')}
        value={position}
        onChangeText={setPosition}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <TextInput
        label={t('members.jerseyNumber')}
        value={jerseyNumber}
        onChangeText={setJerseyNumber}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <View style={styles.row}>
        <TextInput
          label={t('members.height')}
          value={height}
          onChangeText={setHeight}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
          right={<TextInput.Affix text="cm" />}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
        />
        <TextInput
          label={t('members.weight')}
          value={weight}
          onChangeText={setWeight}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
          right={<TextInput.Affix text="kg" />}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('members.parentInfo')}</Text>

      <TextInput
        label={t('members.parentName')}
        value={parentName}
        onChangeText={setParentName}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <TextInput
        label={t('members.parentPhone')}
        value={parentPhone}
        onChangeText={setParentPhone}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <TextInput
        label={t('members.parentEmail')}
        value={parentEmail}
        onChangeText={setParentEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <Text style={styles.sectionTitle}>{t('payments.membershipInfo') || 'Membership Info'}</Text>

      <TextInput
        label={t('payments.monthlyFee') || 'Monthly Fee (RSD)'}
        value={membershipFee}
        onChangeText={setMembershipFee}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving}
        style={styles.saveButton}
        buttonColor={Colors.primary}
      >
        {t('common.save')}
      </Button>

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
    paddingBottom: 150,
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
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
});
