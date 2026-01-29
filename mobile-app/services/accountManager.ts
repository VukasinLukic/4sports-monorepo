import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCOUNTS_KEY = '@4sports_accounts';
const CURRENT_ACCOUNT_KEY = '@4sports_current_account';
const CREDENTIALS_PREFIX = '4sports_cred_';

export interface StoredAccount {
  id: string; // Firebase UID
  email: string;
  fullName: string;
  role: string;
  profileImage?: string;
  lastUsed: number; // timestamp
  hasStoredCredentials?: boolean; // Indicates if password is stored securely
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

/**
 * Store credentials securely for passwordless switching
 */
export const storeCredentials = async (email: string, password: string): Promise<void> => {
  try {
    const key = `${CREDENTIALS_PREFIX}${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    console.log('Storing credentials with key:', key, 'for email:', email);
    await SecureStore.setItemAsync(key, password);
    console.log('Credentials stored successfully for:', email);

    // Verify storage worked
    const verify = await SecureStore.getItemAsync(key);
    console.log('Credential verification:', verify ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('Error storing credentials:', error);
    // Don't throw - passwordless is optional feature
  }
};

/**
 * Retrieve stored credentials for passwordless switching
 */
export const getStoredCredentials = async (email: string): Promise<string | null> => {
  try {
    const key = `${CREDENTIALS_PREFIX}${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    console.log('Retrieving credentials with key:', key);
    const password = await SecureStore.getItemAsync(key);
    console.log('Credentials retrieved:', password ? 'FOUND' : 'NOT FOUND');
    return password;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return null;
  }
};

/**
 * Remove stored credentials
 */
export const removeStoredCredentials = async (email: string): Promise<void> => {
  try {
    const key = `${CREDENTIALS_PREFIX}${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await SecureStore.deleteItemAsync(key);
    console.log('Credentials removed for:', email);
  } catch (error) {
    console.error('Error removing credentials:', error);
  }
};

/**
 * Check if credentials are stored for an account
 */
export const hasStoredCredentials = async (email: string): Promise<boolean> => {
  console.log('Checking stored credentials for:', email);
  const creds = await getStoredCredentials(email);
  const hasCredentials = creds !== null;
  console.log('Has stored credentials:', hasCredentials);
  return hasCredentials;
};
