import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Card } from 'react-native-paper';
import { Link, router } from 'expo-router';
import api, { getApiErrorMessage } from '@/services/api';
import { useLanguage } from '@/services/LanguageContext';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

interface InviteCodeValidation {
  isValid: boolean;
  clubName?: string;
  groupName?: string;
  role?: string;
}

export default function InviteCodeScreen() {
  const { t } = useLanguage();
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
      setError(t('validation.inviteCodeRequired'));
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
      setError(errorMessage || t('auth.invalidInviteCode'));
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
          <Text style={styles.subtitle}>{t('auth.enterInviteCode')}</Text>
          <Text style={styles.description}>
            {t('auth.inviteCodeDescription')}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Invite Code Input */}
          <TextInput
            label={t('auth.inviteCode')}
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
              {t('validation.inviteCodeRequired')}
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
                <Text style={styles.validTitle}>✓ {t('common.success')}</Text>
                {validation.clubName && (
                  <Text style={styles.infoText}>{t('profile.club')}: {validation.clubName}</Text>
                )}
                {validation.groupName && (
                  <Text style={styles.infoText}>{t('groups.group')}: {validation.groupName}</Text>
                )}
                {validation.role && (
                  <Text style={styles.infoText}>{t('roles.' + validation.role.toLowerCase())}</Text>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Validation Result - Invalid */}
          {validation && !validation.isValid && (
            <Card style={styles.invalidCard}>
              <Card.Content>
                <Text style={styles.invalidTitle}>✗ {t('auth.invalidInviteCode')}</Text>
                <Text style={styles.infoText}>
                  {t('common.retry')}
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
              {loading ? t('common.loading') : t('common.confirm')}
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
              {t('auth.continueWithCode')}
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
              {t('common.retry')}
            </Button>
          )}

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{t('auth.hasAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>{t('auth.login')}</Text>
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
