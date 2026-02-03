import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from './api';
import { useAuth } from './AuthContext';

interface NotificationBadgeContextType {
  unreadCount: number;
  refreshBadgeCount: () => Promise<void>;
  decrementBadgeCount: (count?: number) => void;
  setBadgeCount: (count: number) => void;
}

const NotificationBadgeContext = createContext<NotificationBadgeContextType>({
  unreadCount: 0,
  refreshBadgeCount: async () => {},
  decrementBadgeCount: () => {},
  setBadgeCount: () => {},
});

export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshBadgeCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.data.data?.count || 0);
    } catch (error) {
      // Silently fail
    }
  }, [user]);

  const decrementBadgeCount = useCallback((count: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  const setBadgeCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshBadgeCount();
    }
  }, [user, refreshBadgeCount]);

  return (
    <NotificationBadgeContext.Provider
      value={{
        unreadCount,
        refreshBadgeCount,
        decrementBadgeCount,
        setBadgeCount,
      }}
    >
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export function useNotificationBadge() {
  return useContext(NotificationBadgeContext);
}
