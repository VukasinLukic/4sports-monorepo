import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Layout';
import { Event, EventType } from '@/types';

interface EventCalendarProps {
  events: Event[];
  selectedDate: string | null;
  onDayPress: (date: string) => void;
}

interface MarkedDates {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    dots?: Array<{ key: string; color: string }>;
  };
}

export default function EventCalendar({
  events,
  selectedDate,
  onDayPress,
}: EventCalendarProps) {
  const getEventTypeColor = (type: EventType): string => {
    switch (type) {
      case EventType.TRAINING:
        return Colors.eventTraining;
      case EventType.COMPETITION:
        return Colors.eventCompetition;
      case EventType.MEETING:
        return Colors.eventMeeting;
      default:
        return Colors.primary;
    }
  };

  // Generate marked dates from events
  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};

    // Group events by date
    const eventsByDate = new Map<string, Event[]>();
    events.forEach(event => {
      const dateKey = event.date.split('T')[0]; // Get YYYY-MM-DD
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    });

    // Create marks for each date
    eventsByDate.forEach((dateEvents, date) => {
      const dots = dateEvents.slice(0, 3).map((event, index) => ({
        key: `${event._id}-${index}`,
        color: getEventTypeColor(event.type),
      }));

      marks[date] = {
        dots,
        marked: true,
      };
    });

    // Add selected date styling
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: Colors.primary,
      };
    }

    return marks;
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData) => {
    onDayPress(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: Colors.surface,
          calendarBackground: Colors.surface,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.text,
          todayTextColor: Colors.primary,
          dayTextColor: Colors.text,
          textDisabledColor: Colors.textDisabled,
          dotColor: Colors.primary,
          selectedDotColor: Colors.text,
          arrowColor: Colors.primary,
          monthTextColor: Colors.text,
          indicatorColor: Colors.primary,
          textDayFontWeight: '400',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: BorderRadius.md,
  },
});
