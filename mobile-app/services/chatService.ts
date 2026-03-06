import api from './api';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

interface Conversation {
  id: string;
  type: '1-on-1' | 'group' | 'staff-group';
  clubId: string;
  participantIds: string[];
  participantDetails: Record<string, { name: string; avatar: string | null; role: string }>;
  groupName?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    imageUrl?: string;
  };
  unreadCounts?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  images: string[];
  timestamp: Date;
  readBy: string[];
}

/**
 * Upload image to Cloudinary via backend
 */
const uploadImage = async (imageUri: string): Promise<string> => {
  const formData = new FormData();

  // Get file name and type from URI
  const uriParts = imageUri.split('/');
  const fileName = uriParts[uriParts.length - 1];
  const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';

  formData.append('files', {
    uri: imageUri,
    name: fileName,
    type: `image/${fileType}`,
  } as any);

  const response = await api.post('/upload/chat-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.urls[0];
};

export const chatService = {
  /**
   * Create or get existing conversation
   */
  createConversation: async (
    participantIds: string[],
    type: '1-on-1' | 'group' | 'staff-group' = '1-on-1',
    groupName?: string
  ): Promise<Conversation> => {
    const response = await api.post('/chat/conversations', {
      participantIds,
      type,
      groupName,
    });
    return response.data.data;
  },

  /**
   * Get user's conversations
   */
  getConversations: async (filter?: 'all' | 'members' | 'staff'): Promise<Conversation[]> => {
    const response = await api.get('/chat/conversations', {
      params: { filter },
    });
    return response.data.data;
  },

  /**
   * Subscribe to conversations in real-time.
   * Uses Firestore onSnapshot to detect changes, but fetches from the backend
   * API on each change so that participantDetails.avatar is always fresh.
   */
  subscribeToConversations: (
    userId: string,
    clubId: string,
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('clubId', '==', clubId),
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const fetchFreshConversations = async () => {
      try {
        const response = await api.get('/chat/conversations');
        callback(response.data.data || []);
      } catch {
        // Silently ignore — caller retains previous state
      }
    };

    // Debounce to avoid request storms from rapid Firestore changes
    let debounceTimer: ReturnType<typeof setTimeout>;
    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(q, () => {
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        fetchFreshConversations();
        return;
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchFreshConversations();
      }, 500);
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribe();
    };
  },

  /**
   * Send message in conversation
   */
  sendMessage: async (
    conversationId: string,
    text: string,
    imageUris: string[] = []
  ): Promise<Message> => {
    // Upload images first if any
    let imageUrls: string[] = [];
    if (imageUris.length > 0) {
      imageUrls = await Promise.all(imageUris.map(uploadImage));
    }

    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      text,
      images: imageUrls,
    });
    return response.data.data;
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId: string): Promise<void> => {
    await api.post(`/chat/conversations/${conversationId}/read`);
  },

  /**
   * Update FCM token
   */
  updateFCMToken: async (token: string): Promise<void> => {
    await api.post('/chat/fcm-token', { token });
  },

  /**
   * Get count of unread messages for a conversation
   */
  getUnreadCount: (conversation: Conversation, userId: string): number => {
    if (!conversation.unreadCounts || !userId) return 0;
    return conversation.unreadCounts[userId] || 0;
  },
};

export type { Conversation, Message };
