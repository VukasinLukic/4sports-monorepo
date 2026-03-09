import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { db } from '@/config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  limit,
  limitToLast,
  startAfter,
  QueryConstraint,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useAuth } from '@/features/auth/AuthContext';

export interface Conversation {
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
    timestamp: any;
    imageUrl?: string;
  };
  unreadCounts?: Record<string, number>;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  images: string[];
  timestamp: any;
  readBy: string[];
}

export interface ChatUser {
  _id: string;
  fullName: string;
  profileImage?: string;
  role: string;
  email: string;
}

// Hook for real-time conversations
export const useConversations = () => {
  const { backendUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch from backend API which enriches participantDetails with fresh MongoDB avatars
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!backendUser?._id || !backendUser?.clubId || !db) {
      setLoading(false);
      return;
    }

    // Initial fetch with fresh avatars
    fetchConversations();

    let debounceTimer: ReturnType<typeof setTimeout>;

    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('clubId', '==', backendUser.clubId),
        where('participantIds', 'array-contains', backendUser._id),
        orderBy('updatedAt', 'desc')
      );

      let isFirstSnapshot = true;
      // Use onSnapshot only to detect changes, then re-fetch from API for fresh avatars
      const unsubscribe: Unsubscribe = onSnapshot(
        q,
        () => {
          // Skip the initial snapshot (we already fetched above)
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            return;
          }
          // Debounce subsequent fetches to avoid request storms
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchConversations();
          }, 500);
        },
        (err) => {
          console.error('Error subscribing to conversations:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        clearTimeout(debounceTimer);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up conversations subscription:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [backendUser?._id, backendUser?.clubId, fetchConversations]);

  return { conversations, loading, error };
};

// Hook for real-time messages in a conversation with pagination
export const useMessages = (conversationId: string | null) => {
  const { backendUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestDoc, setOldestDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const markAsReadTimer = useRef<ReturnType<typeof setTimeout>>();
  const MESSAGES_PER_PAGE = 25;

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!conversationId || !db || !oldestDoc || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(oldestDoc),
        limit(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const olderMessages: Message[] = [];
      snapshot.forEach((doc) => {
        olderMessages.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });

      // Reverse to get ascending order
      olderMessages.reverse();

      setMessages((prev) => [...olderMessages, ...prev]);
      setOldestDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, oldestDoc, loadingMore, hasMore]);

  useEffect(() => {
    if (!conversationId || !db) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      setOldestDoc(null);
      return;
    }

    setLoading(true);
    setMessages([]);
    setOldestDoc(null);

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      // Fetch latest messages in descending order, then reverse
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(MESSAGES_PER_PAGE)
      );

      const unsubscribe: Unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newMessages: Message[] = [];
          snapshot.forEach((doc) => {
            newMessages.push({
              id: doc.id,
              ...doc.data(),
            } as Message);
          });

          // Reverse to get ascending order (oldest first)
          newMessages.reverse();

          setMessages(newMessages);
          setLoading(false);

          // Set pagination state
          if (snapshot.docs.length > 0) {
            // The oldest doc is at index 0 after we fetched in desc order
            setOldestDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
          } else {
            setHasMore(false);
          }

          // Debounce mark as read to avoid request storms
          if (backendUser?._id && conversationId) {
            clearTimeout(markAsReadTimer.current);
            markAsReadTimer.current = setTimeout(() => {
              api.post(`/chat/conversations/${conversationId}/read`).catch(console.error);
            }, 1000);
          }
        },
        (err) => {
          console.error('Error subscribing to messages:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        clearTimeout(markAsReadTimer.current);
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up messages subscription:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [conversationId, backendUser?._id]);

  return { messages, loading, loadingMore, error, hasMore, loadMore };
};

// Hook to get users for new conversations
export const useChatUsers = () => {
  return useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const response = await api.get('/chat/users');
      return response.data.data as ChatUser[];
    },
  });
};

// Hook to create conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantIds,
      type = '1-on-1',
      groupName,
    }: {
      participantIds: string[];
      type?: '1-on-1' | 'group' | 'staff-group';
      groupName?: string;
    }) => {
      const response = await api.post('/chat/conversations', {
        participantIds,
        type,
        groupName,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

// Hook to send message
export const useSendMessage = () => {
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
      images = [],
    }: {
      conversationId: string;
      text: string;
      images?: string[];
    }) => {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        text,
        images,
      });
      return response.data.data;
    },
  });
};

// Hook to upload chat images
export const useUploadChatImages = () => {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/upload/chat-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data as { urls: string[] };
    },
  });
};
