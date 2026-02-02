import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Member, Event, Post } from '@/types';

// Helper function to get event type color
const getEventTypeColor = (type: string): string => {
  const upperType = type?.toUpperCase() || '';
  if (upperType === 'TRAINING' || upperType.includes('TRENING')) {
    return Colors.eventTraining || Colors.primary;
  }
  if (upperType === 'MATCH' || upperType.includes('UTAKMICA') || upperType.includes('MEČ')) {
    return Colors.eventCompetition || Colors.warning;
  }
  return Colors.eventMeeting || Colors.info;
};

// Check if event is today
const isEventToday = (dateString: string): boolean => {
  const eventDate = new Date(dateString);
  const today = new Date();
  return eventDate.toDateString() === today.toDateString();
};

// Get relative time text
const getRelativeTimeText = (dateString: string, t: any): string => {
  const eventDate = new Date(dateString);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const eventStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const diffTime = eventStart.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('dateTime.today') || 'Danas';
  if (diffDays === 1) return t('dateTime.tomorrow') || 'Sutra';
  if (diffDays > 1 && diffDays <= 7) return `${t('time.in') || 'Za'} ${diffDays} ${t('time.days') || 'dana'}`;
  return '';
};

export default function MemberHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [latestPost, setLatestPost] = useState<(Post & { author?: { fullName: string; profilePicture?: string } }) | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // RSVP state
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'CONFIRMED' | 'DECLINED' | 'PENDING'>('PENDING');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch member's own profile
      const memberResponse = await api.get('/members/me');
      setMember(memberResponse.data.data);

      // Fetch upcoming events
      try {
        const eventsResponse = await api.get('/events/upcoming', { params: { limit: 10 } });
        const events = eventsResponse.data.data || [];
        setUpcomingEvents(events);

        // Set next event for RSVP (first future event)
        const futureEvents = events.filter((e: Event) => new Date(e.startTime) > new Date());
        if (futureEvents.length > 0) {
          setNextEvent(futureEvents[0]);
          // Check current RSVP status
          try {
            const participantsRes = await api.get(`/events/${futureEvents[0]._id}/participants`);
            const participants = participantsRes.data.data?.participants || [];
            const myParticipation = participants.find((p: any) =>
              p.memberId?._id === memberResponse.data.data._id || p.memberId === memberResponse.data.data._id
            );
            if (myParticipation?.rsvpStatus) {
              setRsvpStatus(myParticipation.rsvpStatus);
            } else {
              setRsvpStatus('PENDING');
            }
          } catch {
            setRsvpStatus('PENDING');
          }
        }
      } catch {
        setUpcomingEvents([]);
      }

      // Fetch latest post
      try {
        const postsResponse = await api.get('/posts?limit=1');
        const posts = postsResponse.data.data || [];
        if (posts.length > 0) {
          setLatestPost(posts[0]);
        }
      } catch {
        setLatestPost(null);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMember(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingNews(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Handle RSVP
  const handleRsvp = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (!nextEvent || !member?._id) return;

    setIsSubmittingRsvp(true);
    try {
      await api.post(`/events/${nextEvent._id}/confirm`, {
        memberId: member._id,
        rsvpStatus: status,
      });
      setRsvpStatus(status);
    } catch (error) {
      console.error('RSVP error:', error);
      Alert.alert(t('common.error'), t('rsvp.failed') || 'Greska pri potvrdi prisustva');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('time.justNow') || 'Upravo';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Split events
  const todayEvents = upcomingEvents.filter(event => isEventToday(event.startTime));
  const futureEvents = upcomingEvents.filter(event => !isEventToday(event.startTime));

  const renderEventCard = (event: Event, isToday: boolean) => {
    const eventDate = new Date(event.startTime);
    const dayNumber = eventDate.getDate();
    const dayName = eventDate.toLocaleDateString('sr-RS', { weekday: 'short' });
    const eventTypeColor = getEventTypeColor(event.type);
    const relativeTime = getRelativeTimeText(event.startTime, t);

    // Extract group info like calendar.tsx does
    const groupName = typeof (event as any).groupId === 'object' ? (event as any).groupId?.name : '';
    const groupColor = typeof (event as any).groupId === 'object' ? (event as any).groupId?.color : Colors.primary;

    return (
      <TouchableOpacity
        key={event._id}
        onPress={() => router.push({ pathname: '/(member)/events/[id]', params: { id: event._id } })}
        activeOpacity={0.7}
      >
        <Card style={[styles.eventCard, isToday && styles.eventCardToday]}>
          <Card.Content style={styles.eventCardContent}>
            {/* Date Column */}
            <View style={[
              styles.dateColumn,
              { backgroundColor: isToday ? Colors.success : eventTypeColor }
            ]}>
              <Text style={styles.dateDay}>{dayNumber}</Text>
              <Text style={styles.dateDayName}>{dayName}</Text>
            </View>

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.eventTime}>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </Text>
              </View>

              {/* Group Name */}
              {groupName ? (
                <View style={styles.groupRow}>
                  <View style={[styles.groupDot, { backgroundColor: groupColor || Colors.primary }]} />
                  <Text style={[styles.groupName, { color: groupColor || Colors.primary }]}>
                    {groupName}
                  </Text>
                </View>
              ) : null}

              {/* Location or relative time */}
              {event.location ? (
                <View style={styles.eventMeta}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                </View>
              ) : relativeTime ? (
                <View style={styles.eventMeta}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.eventLocation}>{relativeTime}</Text>
                </View>
              ) : null}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>{t('dashboard.welcomeBack')}</Text>
        <Text style={styles.userName}>{user?.fullName || member?.fullName || t('roles.member')}</Text>
      </View>

      {/* RSVP Section - Next Event Confirmation */}
      {nextEvent && (
        <Card style={styles.rsvpCard}>
          <Card.Content>
            <Text style={styles.rsvpLabel}>{t('rsvp.nextEvent') || 'Sledeći događaj'}</Text>

            <View style={styles.rsvpEventRow}>
              {/* Date Box */}
              <View style={[styles.rsvpDateBox, { backgroundColor: getEventTypeColor(nextEvent.type) }]}>
                <Text style={styles.rsvpDateDay}>{new Date(nextEvent.startTime).getDate()}</Text>
                <Text style={styles.rsvpDateMonth}>
                  {new Date(nextEvent.startTime).toLocaleDateString('sr-RS', { weekday: 'short' })}
                </Text>
              </View>

              {/* Event Info */}
              <View style={styles.rsvpEventInfo}>
                <View style={styles.rsvpTypeRow}>
                  <View style={[styles.rsvpTypeBadge, { backgroundColor: getEventTypeColor(nextEvent.type) + '20' }]}>
                    <Text style={[styles.rsvpTypeText, { color: getEventTypeColor(nextEvent.type) }]}>
                      {nextEvent.type}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rsvpEventTitle} numberOfLines={1}>{nextEvent.title}</Text>
                <Text style={styles.rsvpEventTime}>
                  {getRelativeTimeText(nextEvent.startTime, t)} {formatTime(nextEvent.startTime)}
                </Text>
              </View>
            </View>

            {/* RSVP Buttons */}
            <View style={styles.rsvpButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  styles.rsvpButtonComing,
                  rsvpStatus === 'CONFIRMED' && styles.rsvpButtonActive,
                ]}
                onPress={() => handleRsvp('CONFIRMED')}
                disabled={isSubmittingRsvp}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color={rsvpStatus === 'CONFIRMED' ? '#fff' : Colors.success}
                />
                <Text style={[
                  styles.rsvpButtonText,
                  { color: rsvpStatus === 'CONFIRMED' ? '#fff' : Colors.success }
                ]}>
                  {t('rsvp.coming') || 'Dolazim'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  styles.rsvpButtonNotComing,
                  rsvpStatus === 'DECLINED' && styles.rsvpButtonDeclined,
                ]}
                onPress={() => handleRsvp('DECLINED')}
                disabled={isSubmittingRsvp}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={rsvpStatus === 'DECLINED' ? '#fff' : Colors.error}
                />
                <Text style={[
                  styles.rsvpButtonText,
                  { color: rsvpStatus === 'DECLINED' ? '#fff' : Colors.error }
                ]}>
                  {t('rsvp.notComing') || 'Ne dolazim'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Latest News Section */}
      <Text style={styles.sectionTitle}>{t('navigation.news')}</Text>
      {isLoadingNews ? (
        <Card style={styles.newsCard}>
          <Card.Content style={styles.newsLoadingContent}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </Card.Content>
        </Card>
      ) : latestPost ? (
        <TouchableOpacity onPress={() => router.push('/(member)/news')}>
          <Card style={styles.newsCard}>
            <Card.Content style={styles.newsCardContent}>
              <View style={styles.newsHeader}>
                {latestPost.author?.profilePicture ? (
                  <Avatar.Image size={36} source={{ uri: latestPost.author.profilePicture }} />
                ) : (
                  <Avatar.Text
                    size={36}
                    label={(latestPost.author?.fullName || 'U').slice(0, 2).toUpperCase()}
                    style={styles.newsAvatar}
                  />
                )}
                <View style={styles.newsHeaderInfo}>
                  <Text style={styles.newsAuthor}>{latestPost.author?.fullName || t('roles.coach')}</Text>
                  <Text style={styles.newsTimestamp}>{formatPostDate(latestPost.createdAt)}</Text>
                </View>
              </View>
              {latestPost.title && <Text style={styles.newsTitle} numberOfLines={1}>{latestPost.title}</Text>}
              <Text style={styles.newsContent} numberOfLines={2}>{latestPost.content}</Text>
              {latestPost.images && latestPost.images.length > 0 && (
                <Image source={{ uri: latestPost.images[0] }} style={styles.newsImage} resizeMode="cover" />
              )}
            </Card.Content>
          </Card>
          <TouchableOpacity style={styles.openNewsLink} onPress={() => router.push('/(member)/news')}>
            <Text style={styles.openNewsText}>{t('dashboard.openNews') || 'Otvori vesti'}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <Card style={styles.newsCard}>
          <Card.Content style={styles.emptyNewsContent}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={32} color={Colors.textSecondary} />
            <Text style={styles.emptyNewsText}>{t('news.noPosts') || 'Nema objava'}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('dashboard.todaysEvents') || "Današnji događaji"}</Text>
          <View style={styles.eventsContainer}>
            {todayEvents.map((event) => renderEventCard(event, true))}
          </View>
        </>
      )}

      {/* Upcoming Events */}
      {futureEvents.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>{t('dashboard.upcomingEvents')}</Text>
          <View style={styles.eventsContainer}>
            {futureEvents.slice(0, 5).map((event) => renderEventCard(event, false))}
          </View>
          <Button
            mode="text"
            onPress={() => router.push('/(member)/calendar')}
            style={styles.viewAllButton}
          >
            {t('events.viewAllEvents') || 'Prikaži sve događaje'}
          </Button>
        </>
      ) : todayEvents.length === 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('dashboard.upcomingEvents')}</Text>
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('empty.noUpcomingEvents') || 'Nema predstojećih događaja'}</Text>
            </Card.Content>
          </Card>
        </>
      )}
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
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  // RSVP Section
  rsvpCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  rsvpLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rsvpEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rsvpDateBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  rsvpDateDay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  rsvpDateMonth: {
    fontSize: 11,
    color: '#fff',
    textTransform: 'uppercase',
  },
  rsvpEventInfo: {
    flex: 1,
  },
  rsvpTypeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rsvpTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  rsvpTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  rsvpEventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  rsvpEventTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  rsvpButtonComing: {
    backgroundColor: Colors.success + '15',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  rsvpButtonNotComing: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  rsvpButtonActive: {
    backgroundColor: Colors.success,
  },
  rsvpButtonDeclined: {
    backgroundColor: Colors.error,
  },
  rsvpButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // News Section
  newsCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  newsCardContent: {
    padding: Spacing.sm,
  },
  newsLoadingContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  newsAvatar: {
    backgroundColor: Colors.primary,
  },
  newsHeaderInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  newsAuthor: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  newsTimestamp: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  newsTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  newsContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  newsImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  emptyNewsContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  emptyNewsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  openNewsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  openNewsText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Events
  eventsContainer: {
    marginBottom: Spacing.sm,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  eventCardToday: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  eventCardContent: {
    flexDirection: 'row',
    padding: 0,
    alignItems: 'flex-start',
  },
  dateColumn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateDayName: {
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  eventInfo: {
    flex: 1,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  eventTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  groupName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  eventLocation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
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
  viewAllButton: {
    marginTop: Spacing.xs,
  },
});
