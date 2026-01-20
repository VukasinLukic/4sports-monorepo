import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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
  login: (email: string, password: string) => Promise<void>;
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

  // Fetch user details from backend
  const fetchUserDetails = async (firebaseUser: FirebaseUser): Promise<void> => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      console.log('User details fetched:', response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch user details:', error);
      setError('Failed to load user data');
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        console.log('User authenticated:', firebaseUser.uid);
        await fetchUserDetails(firebaseUser);
      } else {
        console.log('User not authenticated');
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Login with Firebase
      const userCredential = await loginWithEmail(email, password);
      console.log('Firebase login successful');

      // Fetch user details from backend
      await fetchUserDetails(userCredential.user);

      setLoading(false);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      setLoading(false);
      throw error;
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    role: UserRole,
    inviteCode: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Register with Firebase first
      const userCredential = await registerWithEmail(email, password);
      console.log('Firebase registration successful');

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Register with backend (create user record)
      const response = await api.post('/auth/register', {
        email,
        fullName,
        phoneNumber,
        role,
        inviteCode,
      });

      console.log('Backend registration successful');

      // Set user from backend response
      setUser(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
      setLoading(false);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
      setLoading(false);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (firebaseUser) {
      await fetchUserDetails(firebaseUser);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

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
