import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AppColors, Spacing, FontSize } from '@/constants';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>4SPORTS</Text>
        <Text style={styles.subtitle}>Sports Club Management</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Phase 1 Setup Complete!</Text>
          <Text style={styles.description}>
            Mobile app is ready for development.
          </Text>

          <View style={styles.statusContainer}>
            <StatusItem label="Expo Router" status="✓" />
            <StatusItem label="React Native Paper" status="✓" />
            <StatusItem label="Firebase SDK" status="✓" />
            <StatusItem label="React Query" status="✓" />
            <StatusItem label="QR Scanner" status="✓" />
            <StatusItem label="Notifications" status="✓" />
          </View>
        </View>

        <Text style={styles.nextSteps}>
          Next: Phase 2 - Firebase Auth Integration
        </Text>
      </View>
    </View>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  return (
    <View style={styles.statusItem}>
      <Text style={styles.statusIcon}>{status}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  logo: {
    fontSize: FontSize.xxxl * 1.5,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: AppColors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  infoContainer: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: FontSize.xl,
    color: AppColors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statusContainer: {
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIcon: {
    fontSize: FontSize.lg,
    color: AppColors.success,
    width: 24,
  },
  statusLabel: {
    fontSize: FontSize.md,
    color: AppColors.text,
  },
  nextSteps: {
    fontSize: FontSize.sm,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
