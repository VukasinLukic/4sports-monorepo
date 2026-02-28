import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordReset, getAuthErrorMessage } from '@/services/auth';
import { useLanguage } from '@/services/LanguageContext';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';
import api from '@/services/api';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    setError(null);
    if (!email) {
      setError(t('validation.emailRequired'));
      return;
    }
    if (emailError) {
      setError(t('validation.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await api.get('/auth/check-email', { params: { email: normalizedEmail } });
      if (!data.data.exists) {
        setError(t('validation.emailNotRegistered'));
        return;
      }
      await sendPasswordReset(normalizedEmail);
      setSent(true);
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code || 'unknown'));
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
          { paddingTop: insets.top + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={sent ? 'email-check-outline' : 'lock-reset'}
              size={64}
              color={AppColors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('auth.resetPassword')}</Text>

          {sent ? (
            /* Success state */
            <>
              <Text style={styles.successText}>
                {t('auth.resetEmailSent')}
              </Text>
              <Text style={styles.descText}>
                {t('auth.resetEmailSentDesc').replace('{{email}}', email)}
              </Text>
            </>
          ) : (
            /* Form state */
            <>
              <Text style={styles.descText}>{t('auth.resetPasswordDesc')}</Text>

              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                error={!!emailError}
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
              {emailError && (
                <HelperText type="error" visible={!!emailError}>
                  {t('validation.invalidEmail')}
                </HelperText>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleSend}
                loading={loading}
                disabled={loading || !!emailError}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {t('auth.sendResetLink')}
              </Button>
            </>
          )}

          {/* Back to login */}
          <View style={styles.linkContainer}>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>{t('auth.backToLogin')}</Text>
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
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  descText: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  successText: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: AppColors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  link: {
    color: AppColors.primary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
