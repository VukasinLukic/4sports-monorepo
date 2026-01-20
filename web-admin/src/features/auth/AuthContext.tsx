import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, FIREBASE_ENABLED } from '@/config/firebase';
import { loginWithEmail, registerWithEmail, logout as logoutService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development without Firebase
const createMockUser = (email: string): User => {
  return {
    uid: 'mock-user-id',
    email,
    emailVerified: true,
    displayName: 'Mock User',
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    providerId: 'mock',
  } as User;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      // Mock auth - automatically log in as demo user
      const mockUser = createMockUser('demo@4sports.com');
      setUser(mockUser);
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);

      if (!FIREBASE_ENABLED) {
        // Mock login
        const mockUser = createMockUser(email);
        setUser(mockUser);
        console.log('🎭 Mock login successful:', email);
        return;
      }

      const user = await loginWithEmail(email, password);
      setUser(user);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);

      if (!FIREBASE_ENABLED) {
        // Mock register
        const mockUser = createMockUser(email);
        setUser(mockUser);
        console.log('🎭 Mock register successful:', email);
        return mockUser;
      }

      const user = await registerWithEmail(email, password);
      setUser(user);
      return user;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);

      if (!FIREBASE_ENABLED) {
        // Mock logout - redirect to login
        setUser(null);
        console.log('🎭 Mock logout successful');
        return;
      }

      await logoutService();
      setUser(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
