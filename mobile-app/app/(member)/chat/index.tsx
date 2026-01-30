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

type FilterType = 'all' | 'members' | 'staff';

export default function ChatListScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

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

  const renderConversationCard = ({ item }: { item: Conversation }) => {
    const name = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const hasUnread = false; // TODO: implement unread tracking
    const isGroup = item.type === 'group' || item.type === 'staff-group';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(member)/chat/${item.id}`)}
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
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
          <Text
            style={[styles.cardMessage, hasUnread && styles.cardMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>1</Text>
          </View>
        )}
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
            Start a conversation with your coaches
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
        onPress={() => router.push('/(member)/chat/new')}
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
    padding: 16,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatar: {
    backgroundColor: Colors.secondary || '#6366F1',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardMessageUnread: {
    color: Colors.primary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
