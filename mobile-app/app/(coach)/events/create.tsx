import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Switch, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { EventType, Group } from '@/types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateEventScreen() {
  const params = useLocalSearchParams<{ date?: string; groupId?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.TRAINING);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 90 * 60 * 1000)); // +1.5 hours
  const [selectedGroupId, setSelectedGroupId] = useState<string>(params.groupId || '');
  const [groups, setGroups] = useState<Group[]>([]);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMandatory, setIsMandatory] = useState(true);
  const [notes, setNotes] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringUntil, setRecurringUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 days

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurringUntilPicker, setShowRecurringUntilPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const groupsData = response.data.data || [];
      setGroups(groupsData);
      if (groupsData.length > 0) {
        setSelectedGroupId(groupsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
      // Auto-set end time to 1.5 hours after start
      const newEndTime = new Date(selectedTime.getTime() + 90 * 60 * 1000);
      setEndTime(newEndTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const handleRecurringUntilChange = (event: any, selectedDate?: Date) => {
    setShowRecurringUntilPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRecurringUntil(selectedDate);
    }
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setEquipment([...equipment, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an event title.');
      return false;
    }
    if (!selectedGroupId) {
      Alert.alert('Validation Error', 'Please select a group.');
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

    setIsLoading(true);

    try {
      // Combine date and time for startTime/endTime
      const startDateTime = new Date(date);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      const endDateTime = new Date(date);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      const eventData: Record<string, any> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: eventType,
        groupId: selectedGroupId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        isMandatory,
      };

      // Advanced options
      if (notes.trim()) eventData.notes = notes.trim();
      if (equipment.length > 0) eventData.equipment = equipment;
      if (maxParticipants && parseInt(maxParticipants) > 0) {
        eventData.maxParticipants = parseInt(maxParticipants);
      }
      if (isRecurring) {
        eventData.isRecurring = true;
        eventData.recurringPattern = {
          frequency: recurringFrequency,
          days: recurringFrequency === 'weekly' ? recurringDays : undefined,
          until: recurringUntil.toISOString(),
        };
      }

      await api.post('/events', eventData);

      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create event. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingGroups) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        placeholder="e.g., Morning Training Session"
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Group Selection */}
      <Text style={styles.label}>Group *</Text>
      {groups.length === 0 ? (
        <View style={styles.noGroupsContainer}>
          <MaterialCommunityIcons name="account-group-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.noGroupsText}>No groups available. Create a group first.</Text>
        </View>
      ) : (
        <View style={styles.groupsContainer}>
          {groups.map(group => (
            <Button
              key={group._id}
              mode={selectedGroupId === group._id ? 'contained' : 'outlined'}
              onPress={() => setSelectedGroupId(group._id)}
              style={styles.groupButton}
              buttonColor={selectedGroupId === group._id ? Colors.primary : undefined}
              textColor={selectedGroupId === group._id ? Colors.text : Colors.primary}
            >
              {group.name}
            </Button>
          ))}
        </View>
      )}

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
          minimumDate={new Date()}
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
        placeholder="e.g., Main Field, Sports Hall"
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
        placeholder="Additional details about the event..."
        mode="outlined"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Recurring Event Section */}
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Recurring Event</Text>
          <Text style={styles.switchDescription}>Repeat this event on a schedule</Text>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
          color={Colors.primary}
        />
      </View>

      {isRecurring && (
        <View style={styles.recurringSection}>
          {/* Frequency */}
          <Text style={styles.label}>Frequency</Text>
          <SegmentedButtons
            value={recurringFrequency}
            onValueChange={(value) => setRecurringFrequency(value as 'daily' | 'weekly' | 'monthly')}
            buttons={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Days of Week (for weekly) */}
          {recurringFrequency === 'weekly' && (
            <>
              <Text style={styles.label}>Repeat On</Text>
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      recurringDays.includes(index) && styles.dayButtonSelected,
                    ]}
                    onPress={() => toggleRecurringDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        recurringDays.includes(index) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Until Date */}
          <Text style={styles.label}>Repeat Until</Text>
          <Button
            mode="outlined"
            onPress={() => setShowRecurringUntilPicker(true)}
            style={styles.dateButton}
            icon="calendar"
            textColor={Colors.text}
          >
            {recurringUntil.toLocaleDateString()}
          </Button>
          {showRecurringUntilPicker && (
            <DateTimePicker
              value={recurringUntil}
              mode="date"
              display="default"
              onChange={handleRecurringUntilChange}
              minimumDate={date}
            />
          )}
        </View>
      )}

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.advancedToggleText}>Advanced Options</Text>
        <MaterialCommunityIcons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.advancedSection}>
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

          {/* Notes */}
          <Text style={styles.label}>Notes for Attendees</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Special instructions, reminders..."
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            placeholderTextColor={Colors.textSecondary}
          />

          {/* Equipment */}
          <Text style={styles.label}>Required Equipment</Text>
          <View style={styles.equipmentInputRow}>
            <TextInput
              value={newEquipment}
              onChangeText={setNewEquipment}
              placeholder="e.g., Shin guards, Water bottle"
              mode="outlined"
              style={[styles.input, styles.equipmentInput]}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              textColor={Colors.text}
              placeholderTextColor={Colors.textSecondary}
              onSubmitEditing={addEquipment}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={addEquipment}
              containerColor={Colors.primary}
              iconColor={Colors.text}
            />
          </View>
          {equipment.length > 0 && (
            <View style={styles.equipmentList}>
              {equipment.map((item, index) => (
                <Chip
                  key={index}
                  onClose={() => removeEquipment(index)}
                  style={styles.equipmentChip}
                  textStyle={styles.equipmentChipText}
                >
                  {item}
                </Chip>
              ))}
            </View>
          )}

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
        </View>
      )}

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || groups.length === 0}
        style={styles.submitButton}
        icon="check"
      >
        Create Event
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
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  groupButton: {
    marginBottom: Spacing.xs,
  },
  noGroupsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  noGroupsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
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
  submitButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  advancedToggleText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  advancedSection: {
    marginTop: Spacing.sm,
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
  equipmentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  equipmentInput: {
    flex: 1,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  equipmentChip: {
    backgroundColor: Colors.surface,
    height: 32,
  },
  equipmentChipText: {
    fontSize: FontSize.sm,
  },
  recurringSection: {
    marginTop: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: Colors.text,
  },
});
