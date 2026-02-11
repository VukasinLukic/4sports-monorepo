import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { chatService, Conversation } from './chatService';

interface ChatContextType {
  totalUnreadCount: number;
  conversations: Conversation[];
  getUnreadCountForConversation: (conversationId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?._id || !user?.clubId) {
      setConversations([]);
      setTotalUnreadCount(0);
      return;
    }

    const unsubscribe = chatService.subscribeToConversations(
      user._id,
      user.clubId,
      (newConversations) => {
        setConversations(newConversations);

        // Calculate total unread count
        let total = 0;
        newConversations.forEach((conv) => {
          if (conv.unreadCounts && conv.unreadCounts[user._id]) {
            total += conv.unreadCounts[user._id];
          }
        });
        setTotalUnreadCount(total);
      }
    );

    return () => unsubscribe();
  }, [user?._id, user?.clubId]);

  const getUnreadCountForConversation = (conversationId: string): number => {
    if (!user?._id) return 0;
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.unreadCounts) return 0;
    return conv.unreadCounts[user._id] || 0;
  };

  return (
    <ChatContext.Provider
      value={{
        totalUnreadCount,
        conversations,
        getUnreadCountForConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
