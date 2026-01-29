import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { EventType, Event } from '@/types';

export default function EditEventScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.TRAINING);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [isMandatory, setIsMandatory] = useState(true);
  const [notes, setNotes] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [status, setStatus] = useState<'SCHEDULED' | 'CANCELLED' | 'COMPLETED'>('SCHEDULED');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      const event: Event = response.data.data;

      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.type as EventType);
      setLocation(event.location || '');
      setIsMandatory(event.isMandatory ?? true);
      setNotes(event.notes || '');
      setMaxParticipants(event.maxParticipants?.toString() || '');
      setStatus(event.status);

      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      setDate(start);
      setStartTime(start);
      setEndTime(end);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert(t('common.error'), t('errors.loadingFailed'));
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('validation.eventTitleRequired') || 'Please enter an event title.');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert(t('common.error'), t('validation.endTimeAfterStart') || 'End time must be after start time.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const startDateTime = new Date(date);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      const endDateTime = new Date(date);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      await api.put(`/events/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: eventType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        isMandatory,
        notes: notes.trim() || undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        status,
      });

      Alert.alert(t('common.success'), t('events.eventUpdated'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error updating event:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('errors.saveFailed')
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <Text style={styles.label}>{t('events.eventStatus') || 'Event Status'}</Text>
      <SegmentedButtons
        value={status}
        onValueChange={(value) => setStatus(value as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED')}
        buttons={[
          { value: 'SCHEDULED', label: t('events.scheduled') || 'Scheduled' },
          { value: 'COMPLETED', label: t('status.completed') },
          { value: 'CANCELLED', label: t('status.cancelled') },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Event Type */}
      <Text style={styles.label}>{t('events.eventType')}</Text>
      <SegmentedButtons
        value={eventType}
        onValueChange={(value) => setEventType(value as EventType)}
        buttons={[
          { value: EventType.TRAINING, label: t('eventTypes.training') },
          { value: EventType.MATCH, label: t('eventTypes.match') },
          { value: EventType.OTHER, label: t('eventTypes.other') },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Title */}
      <Text style={styles.label}>{t('events.eventName')} *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('events.eventName')}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Date */}
      <Text style={styles.label}>{t('events.eventDate')} *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
        icon="calendar"
        textColor={Colors.text}
      >
        {date.toLocaleDateString()}
      </Button>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Time */}
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>{t('events.startTime')} *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowStartTimePicker(true)}
            style={styles.timeButton}
            icon="clock-outline"
            textColor={Colors.text}
          >
            {formatTime(startTime)}
          </Button>
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
        </View>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>{t('events.endTime')} *</Text>
          <Button
            mode="outlined"
            onPress={() => setShowEndTimePicker(true)}
            style={styles.timeButton}
            icon="clock-outline"
            textColor={Colors.text}
          >
            {formatTime(endTime)}
          </Button>
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </View>
      </View>

      {/* Location */}
      <Text style={styles.label}>{t('events.location')}</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder={t('events.location')}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Description */}
      <Text style={styles.label}>{t('events.description')}</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('events.description')}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Notes */}
      <Text style={styles.label}>{t('events.notesForAttendees') || 'Notes for Attendees'}</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder={t('events.notesPlaceholder') || 'Special instructions...'}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Mandatory Toggle */}
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>{t('events.mandatory')}</Text>
          <Text style={styles.switchDescription}>{t('events.mandatoryDescription') || 'Members must attend'}</Text>
        </View>
        <Switch
          value={isMandatory}
          onValueChange={setIsMandatory}
          color={Colors.primary}
        />
      </View>

      {/* Max Participants */}
      <Text style={styles.label}>{t('events.maxParticipants') || 'Max Participants'} ({t('common.optional')})</Text>
      <TextInput
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        placeholder={t('events.maxParticipantsPlaceholder') || 'Leave empty for unlimited'}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSaving}
        disabled={isSaving}
        style={styles.submitButton}
        icon="check"
      >
        {t('common.save')}
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
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  segmentedButtons: {
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  textArea: {
    minHeight: 100,
  },
  dateButton: {
    borderColor: Colors.border,
    justifyContent: 'flex-start',
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeColumn: {
    flex: 1,
  },
  timeButton: {
    borderColor: Colors.border,
    justifyContent: 'flex-start',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switchLabel: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  switchDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
});
