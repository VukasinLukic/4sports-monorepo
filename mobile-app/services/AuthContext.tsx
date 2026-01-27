import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback, useMemo } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { loginWithEmail, registerWithEmail, logout as logoutUser } from './auth';
import api from './api';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    role: UserRole,
    inviteCode: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  // Flag to prevent onAuthStateChanged from interfering during registration
  const isRegisteringRef = useRef<boolean>(false);
  // Flag to prevent onAuthStateChanged from interfering during login
  const isLoggingInRef = useRef<boolean>(false);

  // Fetch user details from backend
  const fetchUserDetails = useCallback(async (): Promise<User | null> => {
    if (isFetchingRef.current) {
      return null;
    }

    isFetchingRef.current = true;
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      console.log('User details fetched:', userData);
      isFetchingRef.current = false;
      return userData;
    } catch (error: any) {
      console.error('Failed to fetch user details:', error);
      isFetchingRef.current = false;
      return null;
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (!isMounted) return;

      // Skip if we're in the middle of registration or login
      if (isRegisteringRef.current || isLoggingInRef.current) {
        console.log('Skipping auth state change - login/registration in progress');
        return;
      }

      console.log('Auth state changed, fbUser:', fbUser?.uid || 'null');

      if (fbUser) {
        console.log('User authenticated:', fbUser.uid);
        setFirebaseUser(fbUser);

        const userData = await fetchUserDetails();

        if (!isMounted) return;

        if (userData) {
          setUser(userData);
          setError(null);
        } else {
          console.log('No backend user data found');
          setUser(null);
          setError('User profile not found');
        }
      } else {
        console.log('User not authenticated');
        setFirebaseUser(null);
        setUser(null);
        setError(null);
      }

      if (isMounted) {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchUserDetails]);

  // Login function - use useCallback to prevent infinite loops
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    // Set flag to prevent onAuthStateChanged from interfering
    isLoggingInRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Login with Firebase
      const userCredential = await loginWithEmail(email, password);
      console.log('Firebase login successful');

      // Fetch user details from backend
      const userData = await fetchUserDetails();

      if (userData) {
        console.log('Login - user data received:', JSON.stringify(userData, null, 2));
        setUser(userData);
        setFirebaseUser(userCredential.user);
        setError(null);
        setLoading(false);
        setIsInitialized(true);
        return userData;
      } else {
        throw new Error('User profile not found in backend');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      setLoading(false);
      throw error;
    } finally {
      // Always reset the flag
      isLoggingInRef.current = false;
    }
  }, [fetchUserDetails]);

  // Register function
  const register = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    role: UserRole,
    inviteCode: string
  ): Promise<void> => {
    // Set flag to prevent onAuthStateChanged from interfering
    isRegisteringRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Step 1: Register with Firebase
      console.log('Registering with Firebase...');
      let userCredential;
      try {
        userCredential = await registerWithEmail(email, password);
        console.log('Firebase registration successful');
      } catch (firebaseError: any) {
        console.error('Firebase registration failed:', firebaseError);
        throw firebaseError;
      }

      // Step 2: Get Firebase ID token
      const firebaseToken = await userCredential.user.getIdToken();

      // Step 3: Register with backend
      // Backend will validate invite code, phone format, etc.
      // If it fails, we delete the Firebase user to keep things in sync
      console.log('Registering with backend...');
      let response;
      try {
        response = await api.post('/auth/register', {
          firebaseToken,
          email,
          fullName,
          phoneNumber,
          role,
          inviteCode,
        });
        console.log('Backend registration successful');
      } catch (backendError: any) {
        // If backend fails, delete the Firebase user to keep things in sync
        console.error('Backend registration failed, deleting Firebase user...');
        try {
          await userCredential.user.delete();
          console.log('Firebase user deleted after backend failure');
        } catch (deleteError) {
          console.error('Failed to delete Firebase user:', deleteError);
        }
        const errorMsg = backendError.response?.data?.error?.message || 'Registration failed';
        throw new Error(errorMsg);
      }

      // Step 4: Set user state
      console.log('Backend response:', JSON.stringify(response.data, null, 2));
      // Backend returns { data: { user: {...}, token: "..." } }
      const userData = response.data.data?.user || response.data.data || response.data.user || response.data;
      console.log('Setting user data:', JSON.stringify(userData, null, 2));

      if (!userData || !userData.role) {
        console.error('Invalid user data from backend - missing role');
        throw new Error('Invalid user data received from server');
      }

      setUser(userData);
      setFirebaseUser(userCredential.user);
      setError(null);
      setLoading(false);
      setIsInitialized(true);

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      setLoading(false);
      throw error;
    } finally {
      // Always reset the flag
      isRegisteringRef.current = false;
    }
  }, []);

  // Logout function - use useCallback to prevent infinite loops
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
      setError(null);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear user state even if logout fails
      setUser(null);
      setFirebaseUser(null);
      throw error;
    }
  }, []);

  // Refresh user data - use useCallback
  const refreshUser = useCallback(async (): Promise<void> => {
    const userData = await fetchUserDetails();
    if (userData) {
      setUser(userData);
    }
  }, [fetchUserDetails]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(() => ({
    user,
    firebaseUser,
    loading,
    error,
    isInitialized,
    login,
    register,
    logout,
    refreshUser,
  }), [user, firebaseUser, loading, error, isInitialized, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
