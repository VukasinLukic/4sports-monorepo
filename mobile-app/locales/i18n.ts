import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import sr from './sr';

// Storage key for persisted language preference
export const LANGUAGE_STORAGE_KEY = '@4sports_language';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  sr: { name: 'Serbian', nativeName: 'Srpski', flag: '🇷🇸' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Create i18n instance
const i18n = new I18n({
  en,
  sr,
});

// Set default locale based on device settings
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
i18n.defaultLocale = 'en';
i18n.locale = deviceLocale === 'sr' ? 'sr' : 'en';

// Enable fallback to default locale
i18n.enableFallback = true;

// Initialize language from storage
export const initializeLanguage = async (): Promise<LanguageCode> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'sr')) {
      i18n.locale = storedLanguage;
      return storedLanguage;
    }
    // If no stored preference, use device locale
    const locale = deviceLocale === 'sr' ? 'sr' : 'en';
    i18n.locale = locale;
    return locale;
  } catch (error) {
    console.error('Error loading language preference:', error);
    return 'en';
  }
};

// Change language and persist preference
export const setLanguage = async (languageCode: LanguageCode): Promise<void> => {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.locale as LanguageCode;
};

// Helper function for translation with type safety
export const t = (key: string, options?: Record<string, any>): string => {
  return i18n.t(key, options);
};

export default i18n;
