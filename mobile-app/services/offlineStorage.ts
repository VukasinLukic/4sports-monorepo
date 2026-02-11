import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_ATTENDANCE: '@4sports/offline_attendance',
  CACHED_MEMBERS: '@4sports/cached_members',
  CACHED_EVENTS: '@4sports/cached_events',
  LAST_SYNC: '@4sports/last_sync',
};

// Offline attendance record
export interface OfflineAttendanceRecord {
  id: string;
  eventId: string;
  memberId: string;
  memberName?: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  scannedAt: string;
  synced: boolean;
}

/**
 * Save offline attendance records
 */
export async function saveOfflineAttendance(records: OfflineAttendanceRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ATTENDANCE, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving offline attendance:', error);
  }
}

/**
 * Get all offline attendance records
 */
export async function getOfflineAttendance(): Promise<OfflineAttendanceRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ATTENDANCE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline attendance:', error);
    return [];
  }
}

/**
 * Add a single offline attendance record
 */
export async function addOfflineAttendance(record: Omit<OfflineAttendanceRecord, 'id' | 'synced'>): Promise<void> {
  try {
    const existing = await getOfflineAttendance();
    const newRecord: OfflineAttendanceRecord = {
      ...record,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
    };
    existing.push(newRecord);
    await saveOfflineAttendance(existing);
  } catch (error) {
    console.error('Error adding offline attendance:', error);
  }
}

/**
 * Mark attendance records as synced
 */
export async function markAttendanceSynced(ids: string[]): Promise<void> {
  try {
    const records = await getOfflineAttendance();
    const updated = records.map(record =>
      ids.includes(record.id) ? { ...record, synced: true } : record
    );
    await saveOfflineAttendance(updated);
  } catch (error) {
    console.error('Error marking attendance synced:', error);
  }
}

/**
 * Get unsynced attendance records
 */
export async function getUnsyncedAttendance(): Promise<OfflineAttendanceRecord[]> {
  const records = await getOfflineAttendance();
  return records.filter(record => !record.synced);
}

/**
 * Clear synced attendance records (cleanup)
 */
export async function clearSyncedAttendance(): Promise<void> {
  try {
    const records = await getOfflineAttendance();
    const unsynced = records.filter(record => !record.synced);
    await saveOfflineAttendance(unsynced);
  } catch (error) {
    console.error('Error clearing synced attendance:', error);
  }
}

/**
 * Cache data for offline use
 */
export async function cacheData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({
      data,
      cachedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<{ data: T; cachedAt: string } | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return null;
  }
}

/**
 * Cache members data
 */
export async function cacheMembers(members: any[]): Promise<void> {
  await cacheData(STORAGE_KEYS.CACHED_MEMBERS, members);
}

/**
 * Get cached members
 */
export async function getCachedMembers(): Promise<any[] | null> {
  const cached = await getCachedData<any[]>(STORAGE_KEYS.CACHED_MEMBERS);
  return cached?.data || null;
}

/**
 * Cache events data
 */
export async function cacheEvents(events: any[]): Promise<void> {
  await cacheData(STORAGE_KEYS.CACHED_EVENTS, events);
}

/**
 * Get cached events
 */
export async function getCachedEvents(): Promise<any[] | null> {
  const cached = await getCachedData<any[]>(STORAGE_KEYS.CACHED_EVENTS);
  return cached?.data || null;
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last sync:', error);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
}

/**
 * Clear all offline data (for logout)
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.OFFLINE_ATTENDANCE,
      STORAGE_KEYS.CACHED_MEMBERS,
      STORAGE_KEYS.CACHED_EVENTS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

export { STORAGE_KEYS };
