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
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import { getAuthErrorMessage } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

interface RegisterParams {
  inviteCode: string;
  clubName: string;
  clubLogo?: string;
  groupName?: string;
  role: string;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, loading } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<RegisterParams>();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation
  const fullNameError = fullName && fullName.trim().length < 2;
  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneNumberError = phoneNumber && phoneNumber.trim().length < 6;
  const passwordError = password && password.length < 6;
  const confirmPasswordError = confirmPassword && password !== confirmPassword;

  const handleRegister = async () => {
    setError(null);

    // Validate all fields
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setError(t('validation.enterAllFields'));
      return;
    }

    if (fullNameError) {
      setError(t('validation.fullNameRequired'));
      return;
    }

    if (emailError) {
      setError(t('validation.invalidEmail'));
      return;
    }

    if (phoneNumberError) {
      setError(t('validation.phoneInvalid'));
      return;
    }

    if (passwordError) {
      setError(t('validation.passwordMin'));
      return;
    }

    if (confirmPasswordError) {
      setError(t('validation.passwordsNoMatch'));
      return;
    }

    if (!params.inviteCode) {
      setError(t('validation.inviteCodeRequired'));
      return;
    }

    try {
      // Determine role from params
      const role = params.role === 'COACH' ? UserRole.COACH : UserRole.MEMBER;

      await register(
        email,
        password,
        fullName,
        phoneNumber,
        role,
        params.inviteCode
      );

      // Navigate based on role
      if (role === UserRole.COACH || params.role === 'OWNER') {
        router.replace('/(coach)');
      } else if (role === UserRole.MEMBER) {
        router.replace('/(member)');
      } else {
        router.replace('/(parent)');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.code
        ? getAuthErrorMessage(error.code)
        : getApiErrorMessage(error);
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
          { paddingTop: insets.top + Spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Club Info Header */}
        <View style={styles.clubHeader}>
          {params.clubLogo ? (
            <Image
              source={{ uri: params.clubLogo }}
              style={styles.clubLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <MaterialCommunityIcons
                name="shield-outline"
                size={48}
                color={AppColors.primary}
              />
            </View>
          )}
          <Text style={styles.clubName}>{params.clubName || 'Klub'}</Text>
          {params.groupName && (
            <Text style={styles.groupName}>{params.groupName}</Text>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {t('roles.' + (params.role?.toLowerCase() || 'member'))}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <TextInput
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={!!fullNameError}
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
          {fullNameError && (
            <HelperText type="error" visible={fullNameError}>
              {t('validation.fullNameRequired')}
            </HelperText>
          )}

          {/* Email */}
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

          {/* Phone Number */}
          <TextInput
            label={t('auth.phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            mode="outlined"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            error={!!phoneNumberError}
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
          {phoneNumberError && (
            <HelperText type="error" visible={phoneNumberError}>
              {t('validation.phoneInvalid')}
            </HelperText>
          )}

          {/* Password */}
          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
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

          {/* Confirm Password */}
          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            error={!!confirmPasswordError}
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
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                color={AppColors.textSecondary}
              />
            }
          />
          {confirmPasswordError && (
            <HelperText type="error" visible={confirmPasswordError}>
              {t('validation.passwordsNoMatch')}
            </HelperText>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Register Button */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={
              loading ||
              !!fullNameError ||
              !!emailError ||
              !!phoneNumberError ||
              !!passwordError ||
              !!confirmPasswordError
            }
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? t('auth.registering') : t('auth.register')}
          </Button>

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
    padding: Spacing.lg,
  },
  clubHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  clubLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clubName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
  },
  groupName: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.md,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '600',
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
    marginBottom: Spacing.xl,
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
