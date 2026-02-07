import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define pages and their tooltips
export interface TooltipConfig {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface PageTutorial {
  pageKey: string;
  pageName: string;
  description: string;
  tooltips: TooltipConfig[];
}

// Tutorial configurations for each page
export const PAGE_TUTORIALS: Record<string, PageTutorial> = {
  dashboard: {
    pageKey: 'dashboard',
    pageName: 'Dashboard',
    description: 'Pregled glavnih statistika i performansi vašeg kluba.',
    tooltips: [
      {
        id: 'dashboard-stats',
        targetSelector: '[data-tour="stats-cards"]',
        title: 'Statistike kluba',
        description: 'Ovde možete videti ukupan prihod, broj članova i finansijski status vašeg kluba.',
        position: 'bottom',
      },
      {
        id: 'dashboard-charts',
        targetSelector: '[data-tour="charts"]',
        title: 'Grafici',
        description: 'Vizuelni prikaz rasta članstva i finansijskih trendova kroz vreme.',
        position: 'top',
      },
    ],
  },
  members: {
    pageKey: 'members',
    pageName: 'Članovi',
    description: 'Upravljajte članovima vašeg kluba - dodajte nove, pratite plaćanja i medicinske preglede.',
    tooltips: [
      {
        id: 'members-add',
        targetSelector: '[data-tour="add-member"]',
        title: 'Dodaj člana',
        description: 'Kliknite ovde da biste dodali novog člana u klub. Unesite osnovne podatke kao što su ime, datum rođenja i grupu.',
        position: 'bottom',
      },
      {
        id: 'members-filters',
        targetSelector: '[data-tour="filters"]',
        title: 'Filteri',
        description: 'Koristite filtere da biste brzo pronašli članove po statusu plaćanja, medicinskom statusu ili grupi.',
        position: 'bottom',
      },
      {
        id: 'members-table',
        targetSelector: '[data-tour="members-table"]',
        title: 'Lista članova',
        description: 'Ovde se prikazuju svi članovi. Kliknite na red za više detalja ili koristite akcije za uređivanje.',
        position: 'top',
      },
    ],
  },
  coaches: {
    pageKey: 'coaches',
    pageName: 'Treneri',
    description: 'Upravljajte trenerskim kadrom - pozovite nove trenere i pratite njihove ugovore.',
    tooltips: [
      {
        id: 'coaches-invite',
        targetSelector: '[data-tour="invite-coach"]',
        title: 'Pozovi trenera',
        description: 'Generišite pozivni kod koji možete poslati treneru. Kod ima rok trajanja od 7 dana.',
        position: 'bottom',
      },
      {
        id: 'coaches-table',
        targetSelector: '[data-tour="coaches-table"]',
        title: 'Lista trenera',
        description: 'Pregled svih trenera sa njihovim kontakt podacima i statusom ugovora.',
        position: 'top',
      },
    ],
  },
  finances: {
    pageKey: 'finances',
    pageName: 'Finansije',
    description: 'Pratite prihode i rashode kluba, dodajte transakcije i analizirajte finansijsko stanje.',
    tooltips: [
      {
        id: 'finances-add',
        targetSelector: '[data-tour="add-entry"]',
        title: 'Dodaj transakciju',
        description: 'Ručno unesite prihod ili rashod. Članarine se automatski beleže kada član plati.',
        position: 'bottom',
      },
      {
        id: 'finances-summary',
        targetSelector: '[data-tour="summary-cards"]',
        title: 'Finansijski pregled',
        description: 'Brzi pregled ukupnih prihoda, rashoda i neto profita za tekući mesec.',
        position: 'bottom',
      },
      {
        id: 'finances-chart',
        targetSelector: '[data-tour="finance-chart"]',
        title: 'Grafikon',
        description: 'Vizuelni prikaz odnosa prihoda i rashoda.',
        position: 'left',
      },
    ],
  },
  settings: {
    pageKey: 'settings',
    pageName: 'Podešavanja',
    description: 'Konfigurišite podatke o klubu, vaš profil i pregledajte plan pretplate.',
    tooltips: [
      {
        id: 'settings-club',
        targetSelector: '[data-tour="club-settings"]',
        title: 'Podaci o klubu',
        description: 'Ažurirajte osnovne informacije o vašem klubu - ime, adresu, kontakt.',
        position: 'right',
      },
      {
        id: 'settings-profile',
        targetSelector: '[data-tour="profile-settings"]',
        title: 'Vaš profil',
        description: 'Upravljajte vašim ličnim podacima i profilnom slikom.',
        position: 'right',
      },
      {
        id: 'settings-subscription',
        targetSelector: '[data-tour="subscription"]',
        title: 'Pretplata',
        description: 'Pregledajte vaš trenutni plan i limite. Nadogradite za više mogućnosti.',
        position: 'right',
      },
    ],
  },
};

interface OnboardingContextType {
  // State
  completedTutorials: Set<string>;
  currentTutorial: PageTutorial | null;
  currentTooltipIndex: number;
  isShowingTutorial: boolean;
  helpModeEnabled: boolean;

  // Actions
  startTutorial: (pageKey: string) => void;
  nextTooltip: () => void;
  prevTooltip: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: (pageKey: string) => void;
  resetAllTutorials: () => void;
  toggleHelpMode: () => void;
  hasSeenTutorial: (pageKey: string) => boolean;
  checkAndStartTutorial: (pageKey: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = '4sports_completed_tutorials';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [currentTutorial, setCurrentTutorial] = useState<PageTutorial | null>(null);
  const [currentTooltipIndex, setCurrentTooltipIndex] = useState(0);
  const [isShowingTutorial, setIsShowingTutorial] = useState(false);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);

  // Load completed tutorials from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompletedTutorials(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load tutorial state:', error);
    }
  }, []);

  // Save completed tutorials to localStorage
  const saveCompletedTutorials = useCallback((tutorials: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(tutorials)));
    } catch (error) {
      console.error('Failed to save tutorial state:', error);
    }
  }, []);

  const hasSeenTutorial = useCallback((pageKey: string) => {
    return completedTutorials.has(pageKey);
  }, [completedTutorials]);

  const startTutorial = useCallback((pageKey: string) => {
    const tutorial = PAGE_TUTORIALS[pageKey];
    if (tutorial) {
      setCurrentTutorial(tutorial);
      setCurrentTooltipIndex(0);
      setIsShowingTutorial(true);
    }
  }, []);

  const checkAndStartTutorial = useCallback((pageKey: string) => {
    if (!hasSeenTutorial(pageKey) && PAGE_TUTORIALS[pageKey]) {
      // Small delay to allow page to render
      setTimeout(() => startTutorial(pageKey), 500);
    }
  }, [hasSeenTutorial, startTutorial]);

  const nextTooltip = useCallback(() => {
    if (currentTutorial && currentTooltipIndex < currentTutorial.tooltips.length - 1) {
      setCurrentTooltipIndex(prev => prev + 1);
    } else {
      // Tutorial complete
      completeTutorial();
    }
  }, [currentTutorial, currentTooltipIndex]);

  const prevTooltip = useCallback(() => {
    if (currentTooltipIndex > 0) {
      setCurrentTooltipIndex(prev => prev - 1);
    }
  }, [currentTooltipIndex]);

  const skipTutorial = useCallback(() => {
    if (currentTutorial) {
      const newCompleted = new Set(completedTutorials);
      newCompleted.add(currentTutorial.pageKey);
      setCompletedTutorials(newCompleted);
      saveCompletedTutorials(newCompleted);
    }
    setCurrentTutorial(null);
    setCurrentTooltipIndex(0);
    setIsShowingTutorial(false);
  }, [currentTutorial, completedTutorials, saveCompletedTutorials]);

  const completeTutorial = useCallback(() => {
    if (currentTutorial) {
      const newCompleted = new Set(completedTutorials);
      newCompleted.add(currentTutorial.pageKey);
      setCompletedTutorials(newCompleted);
      saveCompletedTutorials(newCompleted);
    }
    setCurrentTutorial(null);
    setCurrentTooltipIndex(0);
    setIsShowingTutorial(false);
  }, [currentTutorial, completedTutorials, saveCompletedTutorials]);

  const resetTutorial = useCallback((pageKey: string) => {
    const newCompleted = new Set(completedTutorials);
    newCompleted.delete(pageKey);
    setCompletedTutorials(newCompleted);
    saveCompletedTutorials(newCompleted);
  }, [completedTutorials, saveCompletedTutorials]);

  const resetAllTutorials = useCallback(() => {
    setCompletedTutorials(new Set());
    saveCompletedTutorials(new Set());
  }, [saveCompletedTutorials]);

  const toggleHelpMode = useCallback(() => {
    setHelpModeEnabled(prev => !prev);
  }, []);

  const value: OnboardingContextType = {
    completedTutorials,
    currentTutorial,
    currentTooltipIndex,
    isShowingTutorial,
    helpModeEnabled,
    startTutorial,
    nextTooltip,
    prevTooltip,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    resetAllTutorials,
    toggleHelpMode,
    hasSeenTutorial,
    checkAndStartTutorial,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
