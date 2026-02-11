import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import i18n, {
  initializeLanguage,
  setLanguage,
  getCurrentLanguage,
  SUPPORTED_LANGUAGES,
  LanguageCode,
  t,
} from '@/locales/i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: typeof t;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from storage on mount
  useEffect(() => {
    const init = async () => {
      try {
        const storedLanguage = await initializeLanguage();
        setLanguageState(storedLanguage);
      } catch (error) {
        console.error('Error initializing language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Change language handler
  const changeLanguage = useCallback(async (code: LanguageCode) => {
    try {
      await setLanguage(code);
      setLanguageState(code);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, []);

  // Translation function that triggers re-render when language changes
  const translate = useCallback((key: string, options?: Record<string, any>): string => {
    return i18n.t(key, options);
  }, [language]); // Re-create when language changes

  const value: LanguageContextType = {
    language,
    setLanguage: changeLanguage,
    t: translate,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for using language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export for convenience
export { SUPPORTED_LANGUAGES, type LanguageCode };
