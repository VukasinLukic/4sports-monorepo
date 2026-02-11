import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, LayoutAnimation, UIManager } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Switch, IconButton, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SAVED_LOCATIONS_KEY = '@saved_locations';
const SAVED_EVENT_TYPES_KEY = '@saved_event_types';
const SAVED_EQUIPMENT_KEY = '@saved_equipment';

const DEFAULT_EVENT_TYPES = [
  { id: 'TRAINING', label: 'Trening' },
  { id: 'MATCH', label: 'Utakmica' },
];

export default function CreateEventScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string; groupId?: string }>();

  const DAYS_OF_WEEK = [
    t('dateTime.days.sun') || 'Ned',
    t('dateTime.days.mon') || 'Pon',
    t('dateTime.days.tue') || 'Uto',
    t('dateTime.days.wed') || 'Sre',
    t('dateTime.days.thu') || 'Čet',
    t('dateTime.days.fri') || 'Pet',
    t('dateTime.days.sat') || 'Sub',
  ];

  // Required fields
  const [eventType, setEventType] = useState<string>('TRAINING');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(params.groupId || '');
  const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 90 * 60 * 1000));

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringUntil, setRecurringUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  // Advanced options (optional)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');

  // Data
  const [groups, setGroups] = useState<Group[]>([]);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  const [savedEquipment, setSavedEquipment] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [newEventType, setNewEventType] = useState('');

  // Menus
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);
  const [eventTypeMenuVisible, setEventTypeMenuVisible] = useState(false);
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [equipmentMenuVisible, setEquipmentMenuVisible] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddEventType, setShowAddEventType] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  // Date pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurringUntilPicker, setShowRecurringUntilPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  useEffect(() => {
    fetchGroups();
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const [locationsJson, typesJson, equipmentJson] = await Promise.all([
        AsyncStorage.getItem(SAVED_LOCATIONS_KEY),
        AsyncStorage.getItem(SAVED_EVENT_TYPES_KEY),
        AsyncStorage.getItem(SAVED_EQUIPMENT_KEY),
      ]);

      if (locationsJson) {
        setSavedLocations(JSON.parse(locationsJson));
      }
      if (typesJson) {
        const savedTypes = JSON.parse(typesJson);
        setEventTypes([...DEFAULT_EVENT_TYPES, ...savedTypes]);
      }
      if (equipmentJson) {
        setSavedEquipment(JSON.parse(equipmentJson));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveLocation = async (loc: string) => {
    if (!loc.trim() || savedLocations.includes(loc.trim())) return;

    const newLocations = [...savedLocations, loc.trim()];
    setSavedLocations(newLocations);
    await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(newLocations));
  };

  const saveEventType = async (type: string) => {
    if (!type.trim()) return;

    const typeId = type.trim().toUpperCase().replace(/\s+/g, '_');
    if (eventTypes.some(t => t.id === typeId)) return;

    const newType = { id: typeId, label: type.trim() };
    const customTypes = eventTypes.filter(t => !DEFAULT_EVENT_TYPES.some(d => d.id === t.id));
    const newCustomTypes = [...customTypes, newType];

    setEventTypes([...DEFAULT_EVENT_TYPES, ...newCustomTypes]);
    await AsyncStorage.setItem(SAVED_EVENT_TYPES_KEY, JSON.stringify(newCustomTypes));
  };

  const saveEquipmentItem = async (item: string) => {
    if (!item.trim() || savedEquipment.includes(item.trim())) return;

    const newEquipmentList = [...savedEquipment, item.trim()];
    setSavedEquipment(newEquipmentList);
    await AsyncStorage.setItem(SAVED_EQUIPMENT_KEY, JSON.stringify(newEquipmentList));
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      const groupsData = response.data.data || [];
      setGroups(groupsData);
      if (groupsData.length > 0 && !params.groupId) {
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
      setEndTime(new Date(selectedTime.getTime() + 90 * 60 * 1000));
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) setEndTime(selectedTime);
  };

  const handleRecurringUntilChange = (event: any, selectedDate?: Date) => {
    setShowRecurringUntilPicker(Platform.OS === 'ios');
    if (selectedDate) setRecurringUntil(selectedDate);
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const toggleAdvancedOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const getSelectedGroupName = () => {
    const group = groups.find(g => g._id === selectedGroupId);
    return group?.name || t('events.selectGroups');
  };

  const getSelectedEventTypeName = () => {
    const type = eventTypes.find(t => t.id === eventType);
    return type?.label || eventType;
  };

  const generateEventTitle = () => {
    const typeName = getSelectedEventTypeName();
    const groupName = getSelectedGroupName();
    return `${typeName} - ${groupName}`;
  };

  const validateForm = (): boolean => {
    if (!selectedGroupId) {
      Alert.alert(t('common.error'), 'Izaberite grupu');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert(t('common.error'), 'Vreme završetka mora biti posle vremena početka');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Save location if new
      if (location.trim() && !savedLocations.includes(location.trim())) {
        await saveLocation(location.trim());
      }

      const startDateTime = new Date(date);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      const endDateTime = new Date(date);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      // Use custom title or generate one
      const eventTitle = title.trim() || generateEventTitle();

      const eventData: Record<string, any> = {
        title: eventTitle,
        description: description.trim() || undefined,
        type: eventType,
        groupId: selectedGroupId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
        isMandatory: true,
      };

      if (isRecurring) {
        eventData.isRecurring = true;
        eventData.recurringPattern = {
          frequency: recurringFrequency,
          days: recurringFrequency === 'weekly' ? recurringDays : undefined,
          until: recurringUntil.toISOString(),
        };
      }

      await api.post('/events', eventData);

      Alert.alert(t('common.success'), t('events.eventCreated'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const addEquipmentItem = (item: string) => {
    if (item.trim() && !equipment.includes(item.trim())) {
      setEquipment([...equipment, item.trim()]);
    }
  };

  const removeEquipmentItem = (item: string) => {
    setEquipment(equipment.filter(e => e !== item));
  };

  if (isLoadingGroups) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={[styles.pageHeader, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('events.createNewEvent')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Type Dropdown */}
        <Text style={styles.label}>{t('events.eventType')} *</Text>
      <Menu
        visible={eventTypeMenuVisible}
        onDismiss={() => setEventTypeMenuVisible(false)}
        anchor={
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setEventTypeMenuVisible(true)}
          >
            <Text style={styles.dropdownText}>{getSelectedEventTypeName()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        {eventTypes.map(type => (
          <Menu.Item
            key={type.id}
            onPress={() => {
              setEventType(type.id);
              setEventTypeMenuVisible(false);
            }}
            title={type.label}
            leadingIcon={eventType === type.id ? 'check' : undefined}
          />
        ))}
        <Menu.Item
          onPress={() => {
            setEventTypeMenuVisible(false);
            setShowAddEventType(true);
          }}
          title="+ Dodaj novi tip"
          titleStyle={{ color: Colors.primary }}
        />
      </Menu>

      {/* Add new event type */}
      {showAddEventType && (
        <View style={styles.addNewRow}>
          <TextInput
            value={newEventType}
            onChangeText={setNewEventType}
            placeholder="Novi tip događaja"
            mode="outlined"
            style={styles.addNewInput}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            dense
          />
          <IconButton
            icon="check"
            mode="contained"
            containerColor={Colors.primary}
            iconColor="#fff"
            size={20}
            onPress={async () => {
              if (newEventType.trim()) {
                await saveEventType(newEventType);
                const typeId = newEventType.trim().toUpperCase().replace(/\s+/g, '_');
                setEventType(typeId);
                setNewEventType('');
                setShowAddEventType(false);
              }
            }}
          />
          <IconButton
            icon="close"
            size={20}
            onPress={() => {
              setNewEventType('');
              setShowAddEventType(false);
            }}
          />
        </View>
      )}

      {/* Group Dropdown */}
      <Text style={styles.label}>Grupa *</Text>
      <Menu
        visible={groupMenuVisible}
        onDismiss={() => setGroupMenuVisible(false)}
        anchor={
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setGroupMenuVisible(true)}
          >
            <Text style={styles.dropdownText}>{getSelectedGroupName()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        {groups.map(group => (
          <Menu.Item
            key={group._id}
            onPress={() => {
              setSelectedGroupId(group._id);
              setGroupMenuVisible(false);
            }}
            title={group.name}
            leadingIcon={selectedGroupId === group._id ? 'check' : undefined}
          />
        ))}
      </Menu>

      {/* Date */}
      <Text style={styles.label}>Datum *</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDatePicker(true)}>
        <MaterialCommunityIcons name="calendar" size={20} color={Colors.textSecondary} />
        <Text style={[styles.dropdownText, { marginLeft: Spacing.sm }]}>
          {date.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />
      )}

      {/* Time */}
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>Početak *</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowStartTimePicker(true)}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.dropdownText, { marginLeft: Spacing.sm }]}>{formatTime(startTime)}</Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker value={startTime} mode="time" display="default" onChange={handleStartTimeChange} />
          )}
        </View>
        <View style={styles.timeColumn}>
          <Text style={styles.label}>Završetak *</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowEndTimePicker(true)}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.dropdownText, { marginLeft: Spacing.sm }]}>{formatTime(endTime)}</Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker value={endTime} mode="time" display="default" onChange={handleEndTimeChange} />
          )}
        </View>
      </View>

      {/* Recurring Toggle */}
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Ponavljanje</Text>
          <Text style={styles.switchDescription}>Ponavljaj ovaj događaj</Text>
        </View>
        <Switch value={isRecurring} onValueChange={setIsRecurring} color={Colors.primary} />
      </View>

      {isRecurring && (
        <View style={styles.recurringSection}>
          {/* Frequency buttons */}
          <View style={styles.frequencyRow}>
            {(['daily', 'weekly', 'monthly'] as const).map(freq => (
              <TouchableOpacity
                key={freq}
                style={[styles.frequencyButton, recurringFrequency === freq && styles.frequencyButtonActive]}
                onPress={() => setRecurringFrequency(freq)}
              >
                <Text style={[styles.frequencyText, recurringFrequency === freq && styles.frequencyTextActive]}>
                  {freq === 'daily' ? 'Dnevno' : freq === 'weekly' ? 'Nedeljno' : 'Mesečno'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {recurringFrequency === 'weekly' && (
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day, index) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, recurringDays.includes(index) && styles.dayButtonSelected]}
                  onPress={() => toggleRecurringDay(index)}
                >
                  <Text style={[styles.dayButtonText, recurringDays.includes(index) && styles.dayButtonTextSelected]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Ponavljaj do</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowRecurringUntilPicker(true)}>
            <MaterialCommunityIcons name="calendar" size={20} color={Colors.textSecondary} />
            <Text style={[styles.dropdownText, { marginLeft: Spacing.sm }]}>{recurringUntil.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showRecurringUntilPicker && (
            <DateTimePicker value={recurringUntil} mode="date" display="default" onChange={handleRecurringUntilChange} minimumDate={date} />
          )}
        </View>
      )}

      {/* ADVANCED OPTIONS BUTTON */}
      <TouchableOpacity style={styles.advancedOptionsButton} onPress={toggleAdvancedOptions}>
        <Text style={styles.advancedOptionsText}>Napredne opcije</Text>
        <MaterialCommunityIcons
          name={showAdvancedOptions ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {/* ADVANCED OPTIONS SECTION */}
      {showAdvancedOptions && (
        <View style={styles.advancedSection}>
          {/* Title */}
          <Text style={styles.label}>Naziv događaja</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={generateEventTitle()}
            mode="outlined"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
          />

          {/* Description */}
          <Text style={styles.label}>Opis</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Dodatne informacije o događaju..."
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
          />

          {/* Location Dropdown */}
          <Text style={styles.label}>Lokacija</Text>
          <Menu
            visible={locationMenuVisible}
            onDismiss={() => setLocationMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setLocationMenuVisible(true)}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.textSecondary} />
                <Text style={[styles.dropdownText, { marginLeft: Spacing.sm, flex: 1 }]}>
                  {location || 'Izaberi lokaciju'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            {savedLocations.map((loc, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setLocation(loc);
                  setLocationMenuVisible(false);
                }}
                title={loc}
                leadingIcon={location === loc ? 'check' : 'map-marker'}
              />
            ))}
            <Menu.Item
              onPress={() => {
                setLocationMenuVisible(false);
                setShowAddLocation(true);
              }}
              title="+ Dodaj novu lokaciju"
              titleStyle={{ color: Colors.primary }}
            />
          </Menu>

          {/* Add new location */}
          {showAddLocation && (
            <View style={styles.addNewRow}>
              <TextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="Nova lokacija"
                mode="outlined"
                style={styles.addNewInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                dense
              />
              <IconButton
                icon="check"
                mode="contained"
                containerColor={Colors.primary}
                iconColor="#fff"
                size={20}
                onPress={async () => {
                  if (newLocation.trim()) {
                    await saveLocation(newLocation);
                    setLocation(newLocation.trim());
                    setNewLocation('');
                    setShowAddLocation(false);
                  }
                }}
              />
              <IconButton
                icon="close"
                size={20}
                onPress={() => {
                  setNewLocation('');
                  setShowAddLocation(false);
                }}
              />
            </View>
          )}

          {/* Equipment */}
          <Text style={styles.label}>Oprema</Text>
          <Menu
            visible={equipmentMenuVisible}
            onDismiss={() => setEquipmentMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setEquipmentMenuVisible(true)}
              >
                <MaterialCommunityIcons name="bag-personal-outline" size={20} color={Colors.textSecondary} />
                <Text style={[styles.dropdownText, { marginLeft: Spacing.sm, flex: 1 }]}>
                  {equipment.length > 0 ? `${equipment.length} stavki` : 'Dodaj opremu'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            {savedEquipment.map((item, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  addEquipmentItem(item);
                  setEquipmentMenuVisible(false);
                }}
                title={item}
                leadingIcon={equipment.includes(item) ? 'check' : 'plus'}
              />
            ))}
            <Menu.Item
              onPress={() => {
                setEquipmentMenuVisible(false);
                setShowAddEquipment(true);
              }}
              title="+ Dodaj novu opremu"
              titleStyle={{ color: Colors.primary }}
            />
          </Menu>

          {/* Add new equipment */}
          {showAddEquipment && (
            <View style={styles.addNewRow}>
              <TextInput
                value={newEquipment}
                onChangeText={setNewEquipment}
                placeholder="Nova oprema"
                mode="outlined"
                style={styles.addNewInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                dense
              />
              <IconButton
                icon="check"
                mode="contained"
                containerColor={Colors.primary}
                iconColor="#fff"
                size={20}
                onPress={async () => {
                  if (newEquipment.trim()) {
                    await saveEquipmentItem(newEquipment);
                    addEquipmentItem(newEquipment);
                    setNewEquipment('');
                    setShowAddEquipment(false);
                  }
                }}
              />
              <IconButton
                icon="close"
                size={20}
                onPress={() => {
                  setNewEquipment('');
                  setShowAddEquipment(false);
                }}
              />
            </View>
          )}

          {/* Selected Equipment Tags */}
          {equipment.length > 0 && (
            <View style={styles.equipmentTags}>
              {equipment.map((item, index) => (
                <View key={index} style={styles.equipmentTag}>
                  <Text style={styles.equipmentTagText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeEquipmentItem(item)}>
                    <MaterialCommunityIcons name="close" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Submit */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || groups.length === 0}
        style={styles.submitButton}
        icon="check"
      >
        {t('events.createEvent')}
      </Button>

      <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton} textColor={Colors.textSecondary}>
        {t('common.cancel')}
      </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  pageTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: { width: 32 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface },
  textArea: { minHeight: 80 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  dropdownText: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  menuContent: { backgroundColor: Colors.surface },
  addNewRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.xs },
  addNewInput: { flex: 1, backgroundColor: Colors.surface },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  timeColumn: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  switchLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text },
  switchDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  recurringSection: { marginTop: Spacing.sm, paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.primary },
  frequencyRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  frequencyButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, alignItems: 'center' },
  frequencyButtonActive: { backgroundColor: Colors.primary },
  frequencyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  frequencyTextActive: { color: '#fff', fontWeight: '600' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  dayButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  dayButtonSelected: { backgroundColor: Colors.primary },
  dayButtonText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  dayButtonTextSelected: { color: '#fff' },
  advancedOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  advancedOptionsText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.primary, marginRight: Spacing.xs },
  advancedSection: { marginTop: Spacing.sm },
  equipmentTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm, gap: Spacing.xs },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  equipmentTagText: { fontSize: FontSize.sm, color: Colors.text },
  submitButton: { marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingVertical: Spacing.xs },
  cancelButton: { marginTop: Spacing.sm, borderColor: Colors.border },
});
