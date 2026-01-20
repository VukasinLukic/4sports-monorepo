import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Card } from 'react-native-paper';
import { Link, router } from 'expo-router';
import api, { getApiErrorMessage } from '@/services/api';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

interface InviteCodeValidation {
  isValid: boolean;
  clubName?: string;
  groupName?: string;
  role?: string;
}

export default function InviteCodeScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<InviteCodeValidation | null>(null);

  const inviteCodeError = inviteCode && inviteCode.trim().length < 3;

  const handleValidate = async () => {
    setError(null);
    setValidation(null);

    // Validate input
    if (!inviteCode || inviteCodeError) {
      setError('Please enter a valid invite code');
      return;
    }

    try {
      setLoading(true);

      // Call backend API to validate invite code
      const response = await api.get(`/invites/validate/${inviteCode.trim()}`);

      console.log('Invite code validation response:', response.data);

      // Set validation result
      setValidation({
        isValid: true,
        clubName: response.data.data.clubName,
        groupName: response.data.data.groupName,
        role: response.data.data.role,
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Invite code validation error:', error);
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage || 'Invalid invite code');
      setValidation({
        isValid: false,
      });
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Navigate to register screen with invite code pre-filled
    router.push({
      pathname: '/(auth)/register',
      params: { inviteCode: inviteCode.trim() },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>4SPORTS</Text>
          <Text style={styles.subtitle}>Enter Invite Code</Text>
          <Text style={styles.description}>
            You need an invite code from your club to register
          </Text>
        </View>

        <View style={styles.form}>
          {/* Invite Code Input */}
          <TextInput
            label="Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            mode="outlined"
            autoCapitalize="characters"
            error={!!inviteCodeError}
            disabled={loading}
            style={styles.input}
            outlineColor={AppColors.border}
            activeOutlineColor={AppColors.primary}
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
          />
          {inviteCodeError && (
            <HelperText type="error" visible={inviteCodeError}>
              Invite code must be at least 3 characters
            </HelperText>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Validation Result - Valid */}
          {validation && validation.isValid && (
            <Card style={styles.validCard}>
              <Card.Content>
                <Text style={styles.validTitle}>✓ Valid Invite Code</Text>
                {validation.clubName && (
                  <Text style={styles.infoText}>Club: {validation.clubName}</Text>
                )}
                {validation.groupName && (
                  <Text style={styles.infoText}>Group: {validation.groupName}</Text>
                )}
                {validation.role && (
                  <Text style={styles.infoText}>Role: {validation.role}</Text>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Validation Result - Invalid */}
          {validation && !validation.isValid && (
            <Card style={styles.invalidCard}>
              <Card.Content>
                <Text style={styles.invalidTitle}>✗ Invalid Invite Code</Text>
                <Text style={styles.infoText}>
                  Please check the code and try again
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Validate Button */}
          {!validation && (
            <Button
              mode="contained"
              onPress={handleValidate}
              loading={loading}
              disabled={loading || !!inviteCodeError || !inviteCode}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {loading ? 'Validating...' : 'Validate Code'}
            </Button>
          )}

          {/* Continue Button */}
          {validation && validation.isValid && (
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Continue to Register
            </Button>
          )}

          {/* Try Again Button */}
          {validation && !validation.isValid && (
            <Button
              mode="outlined"
              onPress={() => {
                setValidation(null);
                setError(null);
                setInviteCode('');
              }}
              style={styles.outlineButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.outlineButtonLabel}
            >
              Try Again
            </Button>
          )}

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>Login</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
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
    color: AppColors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: Spacing.sm,
    backgroundColor: AppColors.surface,
  },
  errorContainer: {
    backgroundColor: AppColors.error + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.error,
  },
  errorText: {
    color: AppColors.error,
    fontSize: FontSize.sm,
  },
  validCard: {
    backgroundColor: AppColors.success + '20',
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
  },
  validTitle: {
    color: AppColors.success,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  invalidCard: {
    backgroundColor: AppColors.error + '20',
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.error,
  },
  invalidTitle: {
    color: AppColors.error,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  infoText: {
    color: AppColors.text,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  button: {
    marginTop: Spacing.lg,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.sm,
  },
  outlineButton: {
    marginTop: Spacing.lg,
    borderColor: AppColors.primary,
    borderRadius: BorderRadius.sm,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  buttonLabel: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  outlineButtonLabel: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    color: AppColors.textSecondary,
    fontSize: FontSize.md,
  },
  link: {
    color: AppColors.primary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
