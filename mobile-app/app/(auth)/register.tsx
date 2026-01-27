import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, RadioButton } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { getAuthErrorMessage } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

export default function RegisterScreen() {
  const { register, loading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PARENT);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation
  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = password && password.length < 6;
  const confirmPasswordError = confirmPassword && password !== confirmPassword;
  const fullNameError = fullName && fullName.trim().length < 2;
  const phoneNumberError = phoneNumber && phoneNumber.trim().length < 6;
  const inviteCodeError = inviteCode && inviteCode.trim().length < 3;

  const handleRegister = async () => {
    setError(null);

    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName || !phoneNumber || !inviteCode) {
      setError('Please fill in all fields');
      return;
    }

    if (emailError) {
      setError('Please enter a valid email address');
      return;
    }

    if (passwordError) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (confirmPasswordError) {
      setError('Passwords do not match');
      return;
    }

    if (fullNameError) {
      setError('Please enter your full name');
      return;
    }

    if (phoneNumberError) {
      setError('Please enter a valid phone number');
      return;
    }

    if (inviteCodeError) {
      setError('Please enter a valid invite code');
      return;
    }

    try {
      await register(email, password, fullName, phoneNumber, role, inviteCode);
      // Navigate directly based on role to avoid race conditions
      console.log('Registration successful, navigating based on role:', role);
      if (role === UserRole.COACH || role === UserRole.OWNER) {
        router.replace('/(coach)');
      } else {
        router.replace('/(parent)');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Try to get Firebase error first, then API error
      let errorMessage = error.code
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>4SPORTS</Text>
          <Text style={styles.subtitle}>Create Account</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name Input */}
          <TextInput
            label="Full Name"
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
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
          />
          {fullNameError && (
            <HelperText type="error" visible={fullNameError}>
              Full name must be at least 2 characters
            </HelperText>
          )}

          {/* Email Input */}
          <TextInput
            label="Email"
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
              Invalid email format
            </HelperText>
          )}

          {/* Phone Number Input */}
          <TextInput
            label="Phone Number"
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
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
          />
          {phoneNumberError && (
            <HelperText type="error" visible={phoneNumberError}>
              Phone number must be at least 6 characters
            </HelperText>
          )}

          {/* Password Input */}
          <TextInput
            label="Password"
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
              Password must be at least 6 characters
            </HelperText>
          )}

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
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
            theme={{ colors: { text: AppColors.text, placeholder: AppColors.textSecondary } }}
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
              Passwords do not match
            </HelperText>
          )}

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

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <RadioButton.Group onValueChange={(value) => setRole(value as UserRole)} value={role}>
              <View style={styles.radioOption}>
                <RadioButton.Android value={UserRole.COACH} color={AppColors.primary} />
                <Text style={styles.radioLabel}>Coach</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value={UserRole.PARENT} color={AppColors.primary} />
                <Text style={styles.radioLabel}>Parent</Text>
              </View>
            </RadioButton.Group>
          </View>

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
              !!emailError ||
              !!passwordError ||
              !!confirmPasswordError ||
              !!fullNameError ||
              !!phoneNumberError ||
              !!inviteCodeError
            }
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </Button>

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
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  roleContainer: {
    marginVertical: Spacing.md,
    padding: Spacing.md,
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.sm,
  },
  roleLabel: {
    color: AppColors.text,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
    fontWeight: 'bold',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  radioLabel: {
    color: AppColors.text,
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
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
