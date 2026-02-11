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

const AGE_GROUPS = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12',
  'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19',
  'U21', 'Seniors', 'Veterans',
];

const SPORTS = [
  'Football', 'Basketball', 'Volleyball', 'Tennis',
  'Swimming', 'Handball', 'Hockey', 'Rugby',
  'Athletics', 'Gymnastics', 'Martial Arts', 'Other',
];

export default function GroupFormScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [sport, setSport] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

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
      setAgeGroup(group.ageGroup || '');
      setSport(group.sport || '');
      setDescription(group.description || '');
      setColor(group.color || PRESET_COLORS[0]);
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
      const payload = {
        name: name.trim(),
        ageGroup: ageGroup || undefined,
        sport: sport || undefined,
        description: description.trim() || undefined,
        color,
      };

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

          {/* Age Group Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('groups.ageGroup') || 'Age Group'}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScrollContent}
            >
              {AGE_GROUPS.map((ag) => (
                <TouchableOpacity
                  key={ag}
                  onPress={() => setAgeGroup(ageGroup === ag ? '' : ag)}
                  style={[
                    styles.chip,
                    ageGroup === ag && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      ageGroup === ag && styles.chipTextSelected,
                    ]}
                  >
                    {ag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sport Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('groups.sport') || 'Sport'}</Text>
            <View style={styles.chipGrid}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSport(sport === s ? '' : s)}
                  style={[
                    styles.chip,
                    sport === s && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sport === s && styles.chipTextSelected,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <TextInput
              label={`${t('groups.groupDescription')} (${t('common.optional')})`}
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              disabled={isSaving}
              style={styles.textArea}
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
                <View style={styles.previewTags}>
                  {ageGroup && (
                    <View style={styles.previewTag}>
                      <Text style={styles.previewTagText}>{ageGroup}</Text>
                    </View>
                  )}
                  {sport && (
                    <View style={[styles.previewTag, styles.previewTagSport]}>
                      <Text style={styles.previewTagText}>{sport}</Text>
                    </View>
                  )}
                </View>
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
  textArea: {
    backgroundColor: Colors.surface,
    minHeight: 100,
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
  chipScrollContent: {
    gap: Spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    marginBottom: Spacing.xs,
  },
  previewTags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  previewTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.xs,
  },
  previewTagSport: {
    backgroundColor: Colors.secondary + '20',
  },
  previewTagText: {
    fontSize: FontSize.xs,
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
