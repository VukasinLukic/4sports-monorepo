import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group } from '@/types';

const PRESET_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FF8C42', // Orange
  '#6C5CE7', // Purple
  '#00B894', // Emerald
  '#E84393', // Pink
];

export default function GroupFormScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [membershipFee, setMembershipFee] = useState('');

  // Validation
  const nameError = name.length > 0 && name.trim().length < 2;
  const isValid = name.trim().length >= 2;

  useEffect(() => {
    if (isEditing) {
      fetchGroup();
    }
  }, [id]);

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      const group: Group = response.data.data;
      setName(group.name);
      setColor(group.color || PRESET_COLORS[0]);
      setMembershipFee(group.membershipFee?.toString() || '');
    } catch (error) {
      console.error('Error fetching group:', error);
      Alert.alert(t('common.error'), t('errors.loadingFailed'));
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert(t('common.error'), t('validation.groupNameRequired') || 'Please enter a valid group name');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        color,
      };
      if (membershipFee) {
        payload.membershipFee = Number(membershipFee);
      }

      if (isEditing) {
        await api.put(`/groups/${id}`, payload);
      } else {
        await api.post('/groups', payload);
      }

      router.back();
    } catch (error: any) {
      console.error('Error saving group:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.error?.message || t('errors.saveFailed')
      );
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
    <>
      <Stack.Screen
        options={{
          title: isEditing ? t('groups.editGroup') : t('groups.createGroup'),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group Name */}
          <View style={styles.field}>
            <TextInput
              label={`${t('groups.groupName')} *`}
              value={name}
              onChangeText={setName}
              mode="outlined"
              error={nameError}
              disabled={isSaving}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            {nameError && (
              <HelperText type="error" visible={nameError}>
                {t('validation.groupNameMin') || 'Group name must be at least 2 characters'}
              </HelperText>
            )}
          </View>

          {/* Color Picker */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('groups.groupColor') || 'Group Color'}</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                >
                  {color === c && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Membership Fee */}
          <View style={styles.field}>
            <TextInput
              label={t('payments.monthlyFee') || 'Monthly Fee (RSD)'}
              value={membershipFee}
              onChangeText={setMembershipFee}
              mode="outlined"
              keyboardType="numeric"
              disabled={isSaving}
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.label}>{t('groups.preview') || 'Preview'}</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewColorBar, { backgroundColor: color }]} />
              <View style={styles.previewContent}>
                <Text style={styles.previewName}>
                  {name.trim() || t('groups.groupName')}
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={!isValid || isSaving}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {isEditing ? t('common.save') : t('groups.createGroup')}
          </Button>

          {/* Cancel Button */}
          <Button
            mode="text"
            onPress={() => router.back()}
            disabled={isSaving}
            style={styles.cancelButton}
            textColor={Colors.textSecondary}
          >
            {t('common.cancel')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.text,
  },
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  previewColorBar: {
    height: 4,
    width: '100%',
  },
  previewContent: {
    padding: Spacing.md,
  },
  previewName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    marginBottom: Spacing.sm,
  },
  saveButtonContent: {
    paddingVertical: Spacing.sm,
  },
  cancelButton: {
    marginBottom: Spacing.md,
  },
});
