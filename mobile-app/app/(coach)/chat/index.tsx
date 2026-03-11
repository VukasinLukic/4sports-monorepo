import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { chatService, Conversation } from '@/services/chatService';
import { Spacing, FontSize } from '@/constants/Layout';

type FilterType = 'all' | 'members' | 'staff';

// Extended conversation with unread counts per user
interface ConversationWithUnread extends Conversation {
  unreadCounts?: Record<string, number>;
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'message-text' },
    { key: 'members', label: 'Members', icon: 'account-group' },
    { key: 'staff', label: 'Staff', icon: 'shield-account' },
  ];

  // Subscribe to conversations
  useEffect(() => {
    if (!user?._id || !user?.clubId) {
      setLoading(false);
      return;
    }

    const unsubscribe = chatService.subscribeToConversations(
      user._id,
      user.clubId,
      (newConversations) => {
        setConversations(newConversations);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?._id, user?.clubId]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const participantNames = Object.values(conv.participantDetails)
        .map((p) => p.name.toLowerCase())
        .join(' ');
      if (!participantNames.includes(searchLower) && !conv.groupName?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (activeFilter === 'members') {
      if (conv.type === 'staff-group') return false;
      const roles = Object.values(conv.participantDetails).map((p) => p.role);
      return roles.includes('MEMBER') || roles.includes('PARENT');
    } else if (activeFilter === 'staff') {
      if (conv.type === 'staff-group') return true;
      const otherParticipants = Object.entries(conv.participantDetails)
        .filter(([id]) => id !== user?._id);
      return otherParticipants.some(([, p]) => ['COACH', 'OWNER'].includes(p.role));
    }

    return true;
  });

  const getConversationName = (conv: Conversation): string => {
    if (conv.type === 'group' || conv.type === 'staff-group') {
      return conv.groupName || 'Group Chat';
    }

    // For 1-on-1, show other participant's name
    const otherParticipant = Object.entries(conv.participantDetails)
      .find(([id]) => id !== user?._id);

    return otherParticipant?.[1]?.name || 'Unknown';
  };

  const getConversationAvatar = (conv: Conversation): string | null => {
    if (conv.type === 'group' || conv.type === 'staff-group') {
      return null;
    }

    const otherParticipant = Object.entries(conv.participantDetails)
      .find(([id]) => id !== user?._id);

    return otherParticipant?.[1]?.avatar || null;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderFilterButton = (filter: { key: FilterType; label: string; icon: string }) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterButton,
        activeFilter === filter.key && styles.filterButtonActive,
      ]}
      onPress={() => setActiveFilter(filter.key)}
    >
      <MaterialCommunityIcons
        name={filter.icon as any}
        size={18}
        color={activeFilter === filter.key ? '#FFFFFF' : Colors.text}
        style={styles.filterIcon}
      />
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter.key && styles.filterButtonTextActive,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const parseTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    try {
      let date: Date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp._seconds != null) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds != null) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatMessageTime = (timestamp: any): string => {
    const date = parseTimestamp(timestamp);
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const renderConversationCard = ({ item }: { item: ConversationWithUnread }) => {
    const name = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const unreadCount = user?._id && item.unreadCounts ? (item.unreadCounts[user._id] || 0) : 0;
    const hasUnread = unreadCount > 0;
    const isGroup = item.type === 'group' || item.type === 'staff-group';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(coach)/chat/${item.id}`)}
      >
        <View style={[styles.avatar, isGroup && styles.groupAvatar]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <>
              {isGroup ? (
                <MaterialCommunityIcons name="account-group" size={24} color="#FFF" />
              ) : (
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardName, hasUnread && styles.cardNameUnread]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.cardTime, hasUnread && styles.cardTimeUnread]}>
              {formatMessageTime(item.lastMessage?.timestamp)}
            </Text>
          </View>
          <View style={styles.cardBottom}>
            <Text
              style={[styles.cardMessage, hasUnread && styles.cardMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessage?.text || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map(renderFilterButton)}
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="message-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation with your team members
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB - New Conversation */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(coach)/chat/new')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: Colors.secondary || '#6366F1',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardNameUnread: {
    fontWeight: '700',
  },
  cardTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  cardTimeUnread: {
    color: Colors.success,
    fontWeight: '600',
  },
  cardMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardMessageUnread: {
    color: Colors.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});
