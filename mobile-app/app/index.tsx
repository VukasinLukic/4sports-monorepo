import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize } from '@/constants';

export default function SplashScreen() {
  const { user, firebaseUser, loading, isInitialized, logout } = useAuth();
  const hasNavigatedRef = useRef(false);
  const logoutRef = useRef(logout);

  // Keep logout ref updated
  logoutRef.current = logout;

  useEffect(() => {
    // Wait for auth to be fully initialized
    if (!isInitialized || loading) {
      return;
    }

    // Prevent multiple navigations
    if (hasNavigatedRef.current) {
      return;
    }

    const navigate = async () => {
      // If no Firebase user, navigate to login
      if (!firebaseUser) {
        console.log('No authenticated user, navigating to login');
        hasNavigatedRef.current = true;
        router.replace('/(auth)/login');
        return;
      }

      // If Firebase user exists but no backend user, logout and go to login
      if (!user) {
        console.log('Firebase user exists but no backend user data - logging out');
        hasNavigatedRef.current = true;
        try {
          await logoutRef.current();
        } catch (e) {
          console.log('Logout error:', e);
        }
        router.replace('/(auth)/login');
        return;
      }

      // Navigate based on user role
      // Handle both uppercase and lowercase roles from backend
      const userRole = user.role?.toUpperCase();
      console.log('User authenticated, role:', user.role, '(normalized:', userRole, ')');
      console.log('Full user object:', JSON.stringify(user, null, 2));
      hasNavigatedRef.current = true;

      if (userRole === 'COACH' || userRole === 'OWNER') {
        console.log('Navigating to coach screens');
        router.replace('/(coach)');
      } else if (userRole === 'PARENT') {
        console.log('Navigating to parent screens');
        router.replace('/(parent)');
      } else {
        // Unknown role, go to login
        console.log('Unknown role:', userRole, '- navigating to login');
        router.replace('/(auth)/login');
      }
    };

    navigate();
  }, [firebaseUser, user, loading, isInitialized]); // removed logout from deps

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>4SPORTS</Text>
        <Text style={styles.subtitle}>Sports Club Management</Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={AppColors.primary}
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  logo: {
    fontSize: FontSize.xxxl * 1.5,
    fontWeight: 'bold',
    color: AppColors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: AppColors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  spinner: {
    marginVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    marginTop: Spacing.md,
  },
});
