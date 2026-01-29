import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import { getAuthErrorMessage } from '@/services/auth';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

export default function LoginScreen() {
  const { login, loading, user } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = password && password.length < 6;

  const handleLogin = async () => {
    setError(null);

    // Validate inputs
    if (!email || !password) {
      setError(t('validation.enterBothEmailPassword'));
      return;
    }

    if (emailError) {
      setError(t('validation.invalidEmail'));
      return;
    }

    if (passwordError) {
      setError(t('validation.passwordMin'));
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      // Navigate directly based on role to avoid race conditions
      const userRole = loggedInUser.role?.toUpperCase();
      console.log('Login successful, navigating based on role:', userRole);

      if (userRole === 'COACH' || userRole === 'OWNER') {
        router.replace('/(coach)');
      } else if (userRole === 'MEMBER') {
        router.replace('/(member)');
      } else if (userRole === 'PARENT') {
        router.replace('/(parent)');
      } else {
        // Fallback to home which will figure it out
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || getAuthErrorMessage(error.code || 'unknown');
      setError(errorMessage);
    }
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
          <Text style={styles.subtitle}>{t('auth.welcomeBack')}</Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
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
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
          />
          {emailError && (
            <HelperText type="error" visible={emailError}>
              {t('validation.invalidEmail')}
            </HelperText>
          )}

          {/* Password Input */}
          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            error={!!passwordError}
            disabled={loading}
            style={styles.input}
            outlineColor={AppColors.border}
            activeOutlineColor={AppColors.primary}
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
                color={AppColors.textSecondary}
              />
            }
          />
          {passwordError && (
            <HelperText type="error" visible={passwordError}>
              {t('validation.passwordMin')}
            </HelperText>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !!emailError || !!passwordError}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </Button>

          {/* Register Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{t('auth.noAccount')} </Text>
            <Link href="/(auth)/register" asChild>
              <Text style={styles.link}>{t('auth.register')}</Text>
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
    color: AppColors.textSecondary,
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
