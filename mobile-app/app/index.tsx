import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize } from '@/constants';

export default function SplashScreen() {
  const { user, firebaseUser, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If no Firebase user, navigate to login
    if (!firebaseUser) {
      console.log('No authenticated user, navigating to login');
      router.replace('/(auth)/login');
      return;
    }

    // If Firebase user exists but no backend user, something went wrong
    if (!user) {
      console.log('Firebase user exists but no backend user data');
      // TODO: Handle this edge case - maybe logout and redirect to login
      router.replace('/(auth)/login');
      return;
    }

    // Navigate based on user role
    console.log('User authenticated, role:', user.role);

    if (user.role === UserRole.COACH || user.role === UserRole.OWNER) {
      // Navigate to coach screens (will be implemented in Phase 3)
      console.log('Navigating to coach screens');
      // router.replace('/(coach)');

      // For now, stay on splash screen until Phase 3
      // Remove this when (coach) routes are ready
    } else if (user.role === UserRole.PARENT) {
      // Navigate to parent screens (will be implemented in Phase 3)
      console.log('Navigating to parent screens');
      // router.replace('/(parent)');

      // For now, stay on splash screen until Phase 3
      // Remove this when (parent) routes are ready
    }
  }, [firebaseUser, user, loading]);

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
          {loading && <Text style={styles.loadingText}>Loading...</Text>}
          {!loading && user && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.roleText}>Role: {user.role}</Text>
              <Text style={styles.phaseInfo}>
                Phase 2 Complete - Firebase Auth Working!
              </Text>
              <Text style={styles.nextPhase}>
                Next: Phase 3 - Navigation & Screens
              </Text>
            </View>
          )}
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
    minHeight: 200,
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
  welcomeContainer: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginTop: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSize.xl,
    color: AppColors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: FontSize.lg,
    color: AppColors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  roleText: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  phaseInfo: {
    fontSize: FontSize.sm,
    color: AppColors.success,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  nextPhase: {
    fontSize: FontSize.sm,
    color: AppColors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
