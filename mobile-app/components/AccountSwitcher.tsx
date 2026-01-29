import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { StoredAccount } from '@/services/accountManager';

interface AccountSwitcherProps {
  visible: boolean;
  onClose: () => void;
  onAccountSwitch: () => void;
}

export default function AccountSwitcher({ visible, onClose, onAccountSwitch }: AccountSwitcherProps) {
  const { user, firebaseUser, getStoredAccounts, switchAccount, removeStoredAccount } = useAuth();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [switchingError, setSwitchingError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    const storedAccounts = await getStoredAccounts();
    setAccounts(storedAccounts);
  }, [getStoredAccounts]);

  useEffect(() => {
    if (visible) {
      loadAccounts();
    }
  }, [visible, loadAccounts]);

  const handleSwitchAccount = async (account: StoredAccount) => {
    if (account.id === firebaseUser?.uid) {
      // Already on this account
      onClose();
      return;
    }

    setShowAddAccount(true);
    setEmail(account.email);
    setPassword('');
    setSwitchingError(null);
  };

  const handleAddAccount = () => {
    setShowAddAccount(true);
    setEmail('');
    setPassword('');
    setSwitchingError(null);
  };

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      setSwitchingError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setSwitchingError(null);

    try {
      await switchAccount(email, password);
      setShowAddAccount(false);
      setEmail('');
      setPassword('');
      onAccountSwitch();
      onClose();
    } catch (error: any) {
      console.error('Switch account error:', error);
      setSwitchingError(error.message || 'Failed to switch account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccount = async (account: StoredAccount) => {
    if (account.id === firebaseUser?.uid) {
      Alert.alert('Cannot Remove', 'You cannot remove the currently active account');
      return;
    }

    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove ${account.email} from saved accounts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeStoredAccount(account.id);
            loadAccounts();
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER':
      case 'COACH':
        return Colors.secondary;
      case 'MEMBER':
        return Colors.primary;
      case 'PARENT':
        return Colors.info;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {showAddAccount ? 'Login to Account' : 'Switch Account'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={Colors.textSecondary}
              onPress={onClose}
            />
          </View>

          {showAddAccount ? (
            // Add/Switch Account Form
            <View style={styles.formContainer}>
              {switchingError && (
                <Text style={styles.errorText}>{switchingError}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />

              <View style={styles.formButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddAccount(false)}
                  style={styles.cancelButton}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleLoginSubmit}
                  style={styles.loginButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Login
                </Button>
              </View>
            </View>
          ) : (
            // Account List
            <ScrollView style={styles.accountList}>
              {accounts.map((account) => {
                const isCurrentAccount = account.id === firebaseUser?.uid;
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.accountItem, isCurrentAccount && styles.currentAccountItem]}
                    onPress={() => handleSwitchAccount(account)}
                    onLongPress={() => handleRemoveAccount(account)}
                  >
                    <Avatar.Text
                      size={48}
                      label={getInitials(account.fullName)}
                      style={[styles.avatar, { backgroundColor: getRoleColor(account.role) }]}
                    />
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.fullName}</Text>
                      <Text style={styles.accountEmail}>{account.email}</Text>
                      <Text style={[styles.accountRole, { color: getRoleColor(account.role) }]}>
                        {account.role}
                      </Text>
                    </View>
                    {isCurrentAccount ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={Colors.success}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={Colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              <Divider style={styles.divider} />

              {/* Add Account Button */}
              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={handleAddAccount}
              >
                <View style={styles.addAccountIcon}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.addAccountText}>Add Another Account</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>Long press on an account to remove it</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  accountList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  currentAccountItem: {
    backgroundColor: Colors.primary + '10',
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  accountInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  accountName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  accountEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accountRole: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  addAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  formContainer: {
    padding: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: Colors.border,
  },
  loginButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});
