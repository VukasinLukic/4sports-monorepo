import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { EventType, Group } from '@/types';

export default function CreateEventScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.TRAINING);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 90 * 60 * 1000)); // +1.5 hours
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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
      await api.post('/events', {
        title: title.trim(),
        description: description.trim() || undefined,
        type: eventType,
        groupId: selectedGroupId,
        date: formatDate(date),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        location: location.trim() || undefined,
      });

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
          { value: EventType.COMPETITION, label: 'Competition' },
          { value: EventType.MEETING, label: 'Meeting' },
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
});
