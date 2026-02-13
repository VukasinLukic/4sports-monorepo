import { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Layout';
import { Event } from '@/types';

interface EventCalendarProps {
  events: Event[];
  selectedDate: string | null;
  onDayPress: (date: string) => void;
  userId?: string; // Current user ID - used to show other coaches' events with lower opacity
}

interface MarkedDates {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    customStyles?: {
      container?: object;
      text?: object;
    };
  };
}

// Helper function to get event type color for any type string
const getEventTypeColor = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return Colors.eventTraining;
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ')) {
    return Colors.eventCompetition;
  }
  if (upperType === 'OTHER') {
    return Colors.eventMeeting;
  }
  // Return primary color for custom types
  return Colors.primary;
};

// Check if current user is coach of an event's group
const isUserCoachOfEvent = (event: Event, userId: string): boolean => {
  if (typeof event.groupId !== 'object') return true;
  const coaches = event.groupId.coaches || [];
  return coaches.some((coachId: any) => {
    const id = typeof coachId === 'string' ? coachId : coachId._id || coachId;
    return id === userId;
  });
};

export default function EventCalendar({
  events,
  selectedDate,
  onDayPress,
  userId,
}: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);

  // Generate marked dates from events
  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};

    // Group events by date
    const eventsByDate = new Map<string, Event[]>();
    events.forEach(event => {
      const dateSource = event.date || event.startTime;
      if (!dateSource) return;
      const dateKey = dateSource.split('T')[0];
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    });

    // Create marks for each date with events
    eventsByDate.forEach((dateEvents, date) => {
      // Get the primary event type color (first event)
      const primaryColor = getEventTypeColor(dateEvents[0].type);

      // Check if any event on this date belongs to current user's groups
      const hasOwnEvent = !userId || dateEvents.some(e => isUserCoachOfEvent(e, userId));
      const opacity = hasOwnEvent ? 1 : 0.3;

      marks[date] = {
        customStyles: {
          container: {
            backgroundColor: primaryColor,
            borderRadius: 20,
            opacity,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
        },
      };
    });

    // Add selected date styling
    if (selectedDate) {
      const existingMark = marks[selectedDate];
      if (existingMark) {
        // If date has events, add border to show selection
        marks[selectedDate] = {
          ...existingMark,
          customStyles: {
            container: {
              ...existingMark.customStyles?.container,
              borderWidth: 2,
              borderColor: Colors.text,
            },
            text: existingMark.customStyles?.text,
          },
        };
      } else {
        // If no events, just show selection
        marks[selectedDate] = {
          customStyles: {
            container: {
              backgroundColor: Colors.primary,
              borderRadius: 20,
            },
            text: {
              color: '#FFFFFF',
              fontWeight: '600',
            },
          },
        };
      }
    }

    return marks;
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData) => {
    onDayPress(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths={true}
        theme={{
          backgroundColor: Colors.surface,
          calendarBackground: Colors.surface,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: Colors.text,
          todayTextColor: Colors.primary,
          todayBackgroundColor: Colors.primary + '20',
          dayTextColor: Colors.text,
          textDisabledColor: Colors.textDisabled,
          dotColor: Colors.primary,
          selectedDotColor: Colors.text,
          arrowColor: Colors.primary,
          monthTextColor: Colors.text,
          indicatorColor: Colors.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 15,
          textMonthFontSize: 17,
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
