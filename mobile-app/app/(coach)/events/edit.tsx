import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { EventType, Event } from '@/types';

export default function EditEventScreen() {
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
      Alert.alert('Error', 'Failed to load event');
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
      Alert.alert('Validation Error', 'Please enter an event title.');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert('Validation Error', 'End time must be after start time.');
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

      Alert.alert('Success', 'Event updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error updating event:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update event. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <Text style={styles.label}>Event Status</Text>
      <SegmentedButtons
        value={status}
        onValueChange={(value) => setStatus(value as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED')}
        buttons={[
          { value: 'SCHEDULED', label: 'Scheduled' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Event Type */}
      <Text style={styles.label}>Event Type</Text>
      <SegmentedButtons
        value={eventType}
        onValueChange={(value) => setEventType(value as EventType)}
        buttons={[
          { value: EventType.TRAINING, label: 'Training' },
          { value: EventType.MATCH, label: 'Match' },
          { value: EventType.OTHER, label: 'Other' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Event title"
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Date */}
      <Text style={styles.label}>Date *</Text>
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
          <Text style={styles.label}>Start Time *</Text>
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
          <Text style={styles.label}>End Time *</Text>
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
      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Event location"
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Event description"
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
      <Text style={styles.label}>Notes for Attendees</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Special instructions..."
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
          <Text style={styles.switchLabel}>Mandatory Event</Text>
          <Text style={styles.switchDescription}>Members must attend</Text>
        </View>
        <Switch
          value={isMandatory}
          onValueChange={setIsMandatory}
          color={Colors.primary}
        />
      </View>

      {/* Max Participants */}
      <Text style={styles.label}>Max Participants (optional)</Text>
      <TextInput
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        placeholder="Leave empty for unlimited"
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
        Save Changes
      </Button>

      {/* Cancel Button */}
      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        Cancel
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
