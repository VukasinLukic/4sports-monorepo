import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Card } from 'react-native-paper';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/services/AuthContext';
import { getAuthErrorMessage } from '@/services/auth';
import api, { getApiErrorMessage } from '@/services/api';
import { UserRole } from '@/types';
import { AppColors, Spacing, FontSize, BorderRadius } from '@/constants';

interface InviteInfo {
  clubName: string;
  groupName?: string;
  role: string;
  type?: string; // Original invite type from backend
}

export default function RegisterScreen() {
  const { register, loading } = useAuth();
  const params = useLocalSearchParams<{ inviteCode?: string }>();

  // Invite info from validation
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteCode, setInviteCode] = useState(params.inviteCode || '');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load invite info when inviteCode changes
  useEffect(() => {
    if (params.inviteCode) {
      setInviteCode(params.inviteCode);
      validateInviteCode(params.inviteCode);
    }
  }, [params.inviteCode]);

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 3) return;

    try {
      setLoadingInvite(true);
      const response = await api.get(`/invites/validate/${code.trim()}`);
      setInviteInfo({
        clubName: response.data.data.clubName || response.data.data.club?.name,
        groupName: response.data.data.groupName || response.data.data.group?.name,
        role: response.data.data.role,
      });
    } catch (err) {
      console.error('Failed to validate invite code:', err);
      setInviteInfo(null);
    } finally {
      setLoadingInvite(false);
    }
  };

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
      // Role is determined by the invite code type on the backend
      // COACH type -> COACH role, MEMBER type -> MEMBER role
      const inviteType = inviteInfo?.type || inviteInfo?.role;
      const determinedRole = inviteType === 'COACH' ? UserRole.COACH : UserRole.MEMBER;
      await register(email, password, fullName, phoneNumber, determinedRole, inviteCode);
      // Navigate directly based on role to avoid race conditions
      console.log('Registration successful, navigating based on role:', determinedRole);
      if (determinedRole === UserRole.COACH || determinedRole === UserRole.OWNER) {
        router.replace('/(coach)');
      } else if (determinedRole === UserRole.MEMBER) {
        router.replace('/(member)');
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

        {/* Club Info Card */}
        {inviteInfo && (
          <Card style={styles.clubCard}>
            <Card.Content>
              <Text style={styles.clubName}>{inviteInfo.clubName}</Text>
              {inviteInfo.groupName && (
                <Text style={styles.groupName}>Group: {inviteInfo.groupName}</Text>
              )}
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                  Joining as: {inviteInfo.role}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

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

          {/* Invite Code Input - only show if not pre-filled */}
          {!params.inviteCode && (
            <>
              <TextInput
                label="Invite Code"
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text);
                  if (text.length >= 6) {
                    validateInviteCode(text);
                  }
                }}
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
            </>
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
  clubCard: {
    backgroundColor: AppColors.primary + '15',
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  clubName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: Spacing.xs,
  },
  groupName: {
    fontSize: FontSize.md,
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  roleTag: {
    backgroundColor: AppColors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  roleTagText: {
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
