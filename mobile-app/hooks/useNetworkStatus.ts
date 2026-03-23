import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import api from '@/services/api';
import {
  getUnsyncedAttendance,
  markAttendanceSynced,
  clearSyncedAttendance,
  updateLastSync,
} from '@/services/offlineStorage';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

interface UseNetworkStatusResult {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  isSyncing: boolean;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Check pending sync count
  const checkPendingSync = useCallback(async () => {
    const unsynced = await getUnsyncedAttendance();
    setPendingSyncCount(unsynced.length);
  }, []);

  // Use ref to track syncing state to avoid re-creating callback
  const isSyncingRef = useRef(false);

  // Sync offline data when back online
  const syncOfflineData = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const unsyncedAttendance = await getUnsyncedAttendance();

      if (unsyncedAttendance.length > 0) {
        // Group by eventId for bulk sync
        const byEvent = unsyncedAttendance.reduce((acc, record) => {
          if (!acc[record.eventId]) {
            acc[record.eventId] = [];
          }
          acc[record.eventId].push(record);
          return acc;
        }, {} as Record<string, typeof unsyncedAttendance>);

        const syncedIds: string[] = [];

        for (const [eventId, records] of Object.entries(byEvent)) {
          try {
            // Try bulk sync
            await api.post('/attendance/bulk', {
              eventId,
              records: records.map(r => ({
                memberId: r.memberId,
                status: r.status,
                markedAt: r.scannedAt,
              })),
            });

            syncedIds.push(...records.map(r => r.id));
          } catch (error) {
            console.error(`Error syncing attendance for event ${eventId}:`, error);

            // Try individual sync as fallback
            for (const record of records) {
              try {
                await api.post('/attendance', {
                  eventId: record.eventId,
                  memberId: record.memberId,
                  status: record.status,
                });
                syncedIds.push(record.id);
              } catch (syncError) {
                console.error(`Error syncing individual attendance record ${record.id}:`, syncError);
              }
            }
          }
        }

        if (syncedIds.length > 0) {
          await markAttendanceSynced(syncedIds);
          await clearSyncedAttendance();
          await updateLastSync();
        }
      }

      await checkPendingSync();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [checkPendingSync]);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    if (networkStatus.isConnected && networkStatus.isInternetReachable) {
      await syncOfflineData();
    }
  }, [networkStatus, syncOfflineData]);

  useEffect(() => {
    // Initial check
    checkPendingSync();

    // Subscribe to network changes
    const unsubscribe: NetInfoSubscription = NetInfo.addEventListener((state: NetInfoState) => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      setNetworkStatus(newStatus);

      // Auto-sync when coming back online
      if (newStatus.isConnected && newStatus.isInternetReachable) {
        syncOfflineData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [checkPendingSync, syncOfflineData]);

  const isOnline = networkStatus.isConnected && networkStatus.isInternetReachable !== false;

  return {
    isOnline,
    networkStatus,
    isSyncing,
    pendingSyncCount,
    syncNow,
  };
}
