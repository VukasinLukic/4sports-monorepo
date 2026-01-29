import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = '@4sports_accounts';
const CURRENT_ACCOUNT_KEY = '@4sports_current_account';

export interface StoredAccount {
  id: string; // Firebase UID
  email: string;
  fullName: string;
  role: string;
  profileImage?: string;
  lastUsed: number; // timestamp
}

/**
 * Get all stored accounts
 */
export const getStoredAccounts = async (): Promise<StoredAccount[]> => {
  try {
    const accountsJson = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!accountsJson) return [];
    return JSON.parse(accountsJson);
  } catch (error) {
    console.error('Error getting stored accounts:', error);
    return [];
  }
};

/**
 * Add or update an account
 */
export const addOrUpdateAccount = async (account: StoredAccount): Promise<void> => {
  try {
    const accounts = await getStoredAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);

    if (existingIndex >= 0) {
      // Update existing account
      accounts[existingIndex] = { ...account, lastUsed: Date.now() };
    } else {
      // Add new account
      accounts.push({ ...account, lastUsed: Date.now() });
    }

    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error adding/updating account:', error);
    throw error;
  }
};

/**
 * Remove an account
 */
export const removeAccount = async (id: string): Promise<void> => {
  try {
    const accounts = await getStoredAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== id);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
  } catch (error) {
    console.error('Error removing account:', error);
    throw error;
  }
};

/**
 * Get current account ID
 */
export const getCurrentAccountId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENT_ACCOUNT_KEY);
  } catch (error) {
    console.error('Error getting current account ID:', error);
    return null;
  }
};

/**
 * Set current account ID
 */
export const setCurrentAccountId = async (id: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_ACCOUNT_KEY, id);

    // Update lastUsed for this account
    const accounts = await getStoredAccounts();
    const accountIndex = accounts.findIndex(a => a.id === id);
    if (accountIndex >= 0) {
      accounts[accountIndex].lastUsed = Date.now();
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch (error) {
    console.error('Error setting current account ID:', error);
    throw error;
  }
};

/**
 * Clear all accounts (for complete logout)
 */
export const clearAllAccounts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCOUNTS_KEY);
    await AsyncStorage.removeItem(CURRENT_ACCOUNT_KEY);
  } catch (error) {
    console.error('Error clearing accounts:', error);
    throw error;
  }
};

/**
 * Get the most recently used account (excluding current)
 */
export const getMostRecentAccount = async (excludeId?: string): Promise<StoredAccount | null> => {
  try {
    const accounts = await getStoredAccounts();
    const filteredAccounts = excludeId
      ? accounts.filter(a => a.id !== excludeId)
      : accounts;

    if (filteredAccounts.length === 0) return null;

    // Sort by lastUsed descending
    filteredAccounts.sort((a, b) => b.lastUsed - a.lastUsed);
    return filteredAccounts[0];
  } catch (error) {
    console.error('Error getting most recent account:', error);
    return null;
  }
};
