import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getApiErrorMessage } from '@/services/api';
import { useLanguage } from '@/services/LanguageContext';
import { LanguageSelector } from '@/components/LanguagePicker';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

interface InviteValidation {
  clubName: string;
  clubLogo?: string;
  groupName?: string;
  role: string;
}

export default function InviteCodeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);

    if (!inviteCode || inviteCode.trim().length < 3) {
      setError(t('validation.inviteCodeRequired'));
      return;
    }

    try {
      setLoading(true);

      // Validate invite code
      const response = await api.get(`/invites/validate/${inviteCode.trim()}`);
      const data = response.data.data;

      // Navigate to register with invite data
      router.push({
        pathname: '/(auth)/register',
        params: {
          inviteCode: inviteCode.trim(),
          clubName: data.clubName || data.club?.name,
          clubLogo: data.clubLogo || data.club?.logo || '',
          groupName: data.groupName || data.group?.name || '',
          role: data.role,
        },
      });
    } catch (error: any) {
      console.error('Invite code validation error:', error);
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage || t('auth.invalidInviteCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/Logo 4sports.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>4sports</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Invite Code Input */}
          <TextInput
            label={t('auth.inviteCode')}
            value={inviteCode}
            onChangeText={setInviteCode}
            mode="outlined"
            autoCapitalize="characters"
            autoFocus
            disabled={loading}
            style={styles.input}
            outlineColor={AppColors.border}
            activeOutlineColor={AppColors.primary}
            theme={{
              colors: {
                text: AppColors.text,
                placeholder: AppColors.textSecondary,
              },
            }}
          />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Continue Button */}
          <Button
            mode="contained"
            onPress={handleContinue}
            loading={loading}
            disabled={loading || !inviteCode.trim()}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? t('common.loading') : t('common.continue')}
          </Button>

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{t('auth.hasAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>{t('auth.login')}</Text>
            </Link>
          </View>
        </View>

        {/* Language Selector at bottom */}
        <View style={styles.languageContainer}>
          <LanguageSelector />
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 240,
    height: 120,
  },
  logoText: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: Spacing.sm,
    letterSpacing: 1,
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
  button: {
    marginTop: Spacing.lg,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.sm,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  buttonLabel: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
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
  languageContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
});
