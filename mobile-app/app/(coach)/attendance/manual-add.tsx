import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Checkbox, Searchbar, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Member, Event, Attendance } from '@/types';

interface MemberWithAttendance extends Member {
  isSelected: boolean;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'EXCUSED';
}

export default function ManualAddScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [members, setMembers] = useState<MemberWithAttendance[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch event details
      const eventResponse = await api.get(`/events/${eventId}`);
      const eventData = eventResponse.data.data;
      setEvent(eventData);

      // Fetch members for the event's group
      const membersResponse = await api.get(`/members`, {
        params: { groupId: eventData.groupId }
      });
      const membersData = membersResponse.data.data || [];

      // Fetch existing attendance for this event
      const attendanceResponse = await api.get(`/attendance/event/${eventId}`);
      const attendanceData = attendanceResponse.data.data || [];
      setExistingAttendance(attendanceData);

      // Create attendance map for quick lookup
      const attendanceMap = new Map<string, Attendance>();
      attendanceData.forEach((a: Attendance) => {
        attendanceMap.set(a.memberId, a);
      });

      // Map members with their attendance status
      const membersWithAttendance: MemberWithAttendance[] = membersData.map((member: Member) => {
        const attendance = attendanceMap.get(member._id);
        return {
          ...member,
          isSelected: attendance?.status === 'PRESENT',
          attendanceStatus: attendance?.status,
        };
      });

      setMembers(membersWithAttendance);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setMembers(prev =>
      prev.map(member =>
        member._id === memberId
          ? { ...member, isSelected: !member.isSelected }
          : member
      )
    );
  };

  const selectAll = () => {
    setMembers(prev => prev.map(member => ({ ...member, isSelected: true })));
  };

  const deselectAll = () => {
    setMembers(prev => prev.map(member => ({ ...member, isSelected: false })));
  };

  const handleSave = async () => {
    const selectedMembers = members.filter(m => m.isSelected);
    const deselectedMembers = members.filter(m => !m.isSelected);

    if (selectedMembers.length === 0 && deselectedMembers.length === 0) {
      Alert.alert('No Changes', 'Please select members to mark attendance.');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare attendance records
      const attendanceRecords = members.map(member => ({
        memberId: member._id,
        status: member.isSelected ? 'PRESENT' : 'ABSENT',
      }));

      await api.post('/attendance/bulk', {
        eventId,
        attendance: attendanceRecords,
      });

      Alert.alert(
        'Success',
        `Attendance saved. ${selectedMembers.length} present, ${deselectedMembers.length} absent.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save attendance. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = members.filter(m => m.isSelected).length;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Event Info */}
      {event && (
        <Card style={styles.eventCard}>
          <Card.Content style={styles.eventContent}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>
                {new Date(event.date).toLocaleDateString()} • {event.startTime} - {event.endTime}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: Colors.eventTraining + '20' }]}>
              <Text style={[styles.typeText, { color: Colors.eventTraining }]}>{event.type}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textSecondary}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Selection Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.countChip}>
          <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
          <Text style={styles.countText}>{selectedCount}/{members.length} selected</Text>
        </View>
        <View style={styles.buttonGroup}>
          <Chip
            onPress={selectAll}
            style={styles.controlChip}
            textStyle={styles.chipText}
          >
            Select All
          </Chip>
          <Chip
            onPress={deselectAll}
            style={styles.controlChip}
            textStyle={styles.chipText}
          >
            Clear All
          </Chip>
        </View>
      </View>

      {/* Members List */}
      <ScrollView style={styles.membersList} contentContainerStyle={styles.membersContent}>
        {filteredMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No members found</Text>
            </Card.Content>
          </Card>
        ) : (
          filteredMembers.map(member => (
            <Card
              key={member._id}
              style={[
                styles.memberCard,
                member.isSelected && styles.memberCardSelected,
              ]}
              onPress={() => toggleMember(member._id)}
            >
              <Card.Content style={styles.memberContent}>
                <Checkbox
                  status={member.isSelected ? 'checked' : 'unchecked'}
                  onPress={() => toggleMember(member._id)}
                  color={Colors.success}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.fullName}</Text>
                  <Text style={styles.memberMeta}>Age: {member.age}</Text>
                </View>
                {member.attendanceStatus && (
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: member.attendanceStatus === 'PRESENT'
                        ? Colors.success + '20'
                        : Colors.error + '20'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      {
                        color: member.attendanceStatus === 'PRESENT'
                          ? Colors.success
                          : Colors.error
                      }
                    ]}>
                      {member.attendanceStatus}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.cancelButton}
          textColor={Colors.text}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
          icon="content-save"
        >
          Save Attendance
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  eventCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginBottom: 0,
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  eventMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    color: Colors.text,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  countText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  controlChip: {
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: FontSize.xs,
  },
  membersList: {
    flex: 1,
  },
  membersContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  memberCardSelected: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
});
