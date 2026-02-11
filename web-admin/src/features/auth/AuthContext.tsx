import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, FIREBASE_ENABLED } from '@/config/firebase';
import { loginWithEmail, registerWithEmail, logout as logoutService } from '@/services/auth';
import api from '@/services/api';

// Backend user data
interface BackendUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'COACH' | 'PARENT' | 'MEMBER';
  clubId?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  backendUser: BackendUser | null;
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
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch backend user data and verify role
  const fetchBackendUser = async (): Promise<BackendUser | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (err) {
      console.error('Failed to fetch backend user:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      // Mock auth - automatically log in as demo user with OWNER role
      const mockUser = createMockUser('demo@4sports.com');
      setUser(mockUser);
      setBackendUser({
        _id: 'mock-id',
        email: 'demo@4sports.com',
        fullName: 'Demo Owner',
        role: 'OWNER',
        clubId: 'mock-club-id',
      });
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch backend user data
        const userData = await fetchBackendUser();
        setBackendUser(userData);

        // Check if user is OWNER - if not, clear the session
        if (userData && userData.role !== 'OWNER') {
          console.warn('Access denied: Only OWNER role can access web admin');
          setError('Access denied. Only club owners can access the admin panel.');
          await logoutService();
          setUser(null);
          setBackendUser(null);
        }
      } else {
        setBackendUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);

      if (!FIREBASE_ENABLED) {
        // Mock login with OWNER role
        const mockUser = createMockUser(email);
        setUser(mockUser);
        setBackendUser({
          _id: 'mock-id',
          email,
          fullName: 'Demo Owner',
          role: 'OWNER',
          clubId: 'mock-club-id',
        });
        console.log('🎭 Mock login successful:', email);
        return;
      }

      const firebaseUser = await loginWithEmail(email, password);
      setUser(firebaseUser);

      // Fetch backend user data and verify role
      const userData = await fetchBackendUser();
      setBackendUser(userData);

      if (!userData) {
        throw new Error('User not found in system. Please register first.');
      }

      if (userData.role !== 'OWNER') {
        // User is not OWNER - logout and throw error
        await logoutService();
        setUser(null);
        setBackendUser(null);
        throw new Error('Access denied. Only club owners can access the admin panel. Coaches should use the mobile app.');
      }
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
        // Mock register with OWNER role
        const mockUser = createMockUser(email);
        setUser(mockUser);
        setBackendUser({
          _id: 'mock-id',
          email,
          fullName: 'New Owner',
          role: 'OWNER',
          clubId: 'mock-club-id',
        });
        console.log('🎭 Mock register successful:', email);
        return mockUser;
      }

      const firebaseUser = await registerWithEmail(email, password);
      setUser(firebaseUser);

      // Note: Registration creates OWNER by default in web-admin
      // Backend should handle this appropriately
      const userData = await fetchBackendUser();
      setBackendUser(userData);

      return firebaseUser;
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
        setBackendUser(null);
        console.log('🎭 Mock logout successful');
        return;
      }

      await logoutService();
      setUser(null);
      setBackendUser(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
      throw err;
    }
  };

  const value = {
    user,
    backendUser,
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
