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
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import { getAuthErrorMessage } from '@/services/auth';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loading } = useAuth();
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
      const userRole = loggedInUser.role?.toUpperCase();
      console.log('Login successful, navigating based on role:', userRole);

      if (userRole === 'COACH' || userRole === 'OWNER') {
        router.replace('/(coach)');
      } else if (userRole === 'MEMBER') {
        router.replace('/(member)');
      } else if (userRole === 'PARENT') {
        router.replace('/(parent)');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage =
        error.message || getAuthErrorMessage(error.code || 'unknown');
      setError(errorMessage);
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/Logo 4sports.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>4sports</Text>
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
            theme={{
              colors: {
                text: AppColors.text,
                placeholder: AppColors.textSecondary,
              },
            }}
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
            theme={{
              colors: {
                text: AppColors.text,
                placeholder: AppColors.textSecondary,
              },
            }}
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
            <Link href="/(auth)/invite-code" asChild>
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
});
