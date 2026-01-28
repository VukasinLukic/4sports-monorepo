import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import api from '@/services/api';
import { Group } from '@/types';

interface InviteCode {
  _id: string;
  code: string;
  type: 'COACH' | 'MEMBER';
  groupId?: {
    _id: string;
    name: string;
    ageGroup?: string;
  };
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  isValid: boolean;
  createdAt: string;
}

export default function InviteCodesScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<InviteCode | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        api.get('/groups'),
        api.get('/invites'),
      ]);

      setGroups(groupsRes.data.data || []);
      setInviteCodes(invitesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleCreateTestGroup = async () => {
    setIsCreatingGroup(true);
    try {
      const response = await api.post('/groups', {
        name: 'Test Group',
        ageGroup: 'U12',
        sport: 'Football',
        description: 'Test group for development',
      });

      const newGroup = response.data.data;
      setGroups([newGroup]);
      setSelectedGroup(newGroup);
      Alert.alert('Success', 'Test group created successfully!');
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to create group'
      );
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedGroup) {
      Alert.alert('Select Group', 'Please select a group first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post('/invites/generate', {
        type: 'MEMBER',
        groupId: selectedGroup._id,
        maxUses: 30,
        expiresInDays: 30,
      });

      const newCode = response.data.data;
      setGeneratedCode({
        ...newCode,
        groupId: {
          _id: selectedGroup._id,
          name: selectedGroup.name,
          ageGroup: selectedGroup.ageGroup,
        },
        isValid: true,
      });

      // Refresh invite codes list
      fetchData();
    } catch (error: any) {
      console.error('Error generating code:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Failed to generate invite code'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getInviteMessage = (code: string, groupName: string) => {
    return `Pridružite se našem klubu u aplikaciji 4Sports!\n\n` +
      `Grupa: ${groupName}\n` +
      `Pozivni kod: ${code}\n\n` +
      `1. Preuzmite aplikaciju 4Sports\n` +
      `2. Izaberite "Imam pozivni kod"\n` +
      `3. Unesite kod: ${code}\n` +
      `4. Registrujte se i dodajte svoje dete`;
  };

  const handleCopyCode = async (code: string, groupName: string) => {
    const message = getInviteMessage(code, groupName);
    await Clipboard.setStringAsync(message);
    Alert.alert('Copied!', 'Invite message copied to clipboard');
  };

  const handleShareCode = async (code: string, groupName: string) => {
    const message = getInviteMessage(code, groupName);
    try {
      await Share.share({
        message,
        title: 'Join our sports club!',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDeactivateCode = async (code: string) => {
    Alert.alert(
      'Deactivate Code',
      'Are you sure you want to deactivate this invite code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/invites/${code}`);
              fetchData();
            } catch (error) {
              console.error('Error deactivating code:', error);
              Alert.alert('Error', 'Failed to deactivate code');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Generate New Code Section */}
      <Card style={styles.generateCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Generate Invite Code</Text>
          <Text style={styles.sectionDescription}>
            Select a group and generate an invite code that parents can use to register.
          </Text>

          {/* No Groups - Create Test Group */}
          {groups.length === 0 ? (
            <View style={styles.noGroupsContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.noGroupsText}>No groups available</Text>
              <Text style={styles.noGroupsSubtext}>
                Create a test group to start generating invite codes
              </Text>
              <Button
                mode="contained"
                onPress={handleCreateTestGroup}
                loading={isCreatingGroup}
                disabled={isCreatingGroup}
                style={styles.createGroupButton}
                icon="plus"
              >
                Create Test Group
              </Button>
            </View>
          ) : (
            <>
              {/* Group Selector */}
              <View style={styles.groupSelector}>
                <Text style={styles.label}>Select Group</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setMenuVisible(true)}
                      style={styles.dropdownButton}
                      contentStyle={styles.dropdownContent}
                      icon="chevron-down"
                    >
                      {selectedGroup
                        ? `${selectedGroup.name}${selectedGroup.ageGroup ? ` (${selectedGroup.ageGroup})` : ''}`
                        : 'Choose a group...'}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  {groups.map((group) => (
                    <Menu.Item
                      key={group._id}
                      onPress={() => {
                        setSelectedGroup(group);
                        setMenuVisible(false);
                      }}
                      title={`${group.name}${group.ageGroup ? ` (${group.ageGroup})` : ''}`}
                      titleStyle={styles.menuItemTitle}
                    />
                  ))}
                </Menu>
              </View>

              {/* Generate Button */}
              <Button
                mode="contained"
                onPress={handleGenerateCode}
                loading={isGenerating}
                disabled={!selectedGroup || isGenerating}
                style={styles.generateButton}
                icon="qrcode"
              >
                Generate Code
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Generated Code Display */}
      {generatedCode && (
        <Card style={styles.codeCard}>
          <Card.Content>
            <View style={styles.codeHeader}>
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={Colors.success}
              />
              <Text style={styles.codeSuccessText}>Code Generated!</Text>
            </View>

            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{generatedCode.code}</Text>
            </View>

            <Text style={styles.codeInfo}>
              Group: {generatedCode.groupId?.name || 'Unknown'}
              {generatedCode.groupId?.ageGroup && ` (${generatedCode.groupId.ageGroup})`}
            </Text>
            <Text style={styles.codeInfo}>
              Max uses: {generatedCode.maxUses} | Expires: {formatDate(generatedCode.expiresAt)}
            </Text>

            <View style={styles.codeActions}>
              <Button
                mode="contained"
                icon="content-copy"
                onPress={() =>
                  handleCopyCode(
                    generatedCode.code,
                    generatedCode.groupId?.name || 'Our Club'
                  )
                }
                style={styles.actionButton}
              >
                Copy Message
              </Button>
              <Button
                mode="outlined"
                icon="share-variant"
                onPress={() =>
                  handleShareCode(
                    generatedCode.code,
                    generatedCode.groupId?.name || 'Our Club'
                  )
                }
                style={styles.actionButton}
                textColor={Colors.text}
              >
                Share
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Existing Codes Section */}
      <View style={styles.existingSection}>
        <Text style={styles.sectionTitle}>Existing Invite Codes</Text>

        {inviteCodes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="qrcode"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>No invite codes yet</Text>
              <Text style={styles.emptySubtext}>
                Generate your first code above
              </Text>
            </Card.Content>
          </Card>
        ) : (
          inviteCodes.map((invite) => (
            <Card
              key={invite._id}
              style={[
                styles.inviteCard,
                !invite.isValid && styles.inviteCardInactive,
              ]}
            >
              <Card.Content>
                <View style={styles.inviteHeader}>
                  <View style={styles.inviteCodeContainer}>
                    <Text style={styles.inviteCode}>{invite.code}</Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.statusChip,
                        invite.isValid
                          ? styles.statusChipActive
                          : styles.statusChipInactive,
                      ]}
                      textStyle={styles.statusChipText}
                    >
                      {invite.isValid ? 'Active' : 'Inactive'}
                    </Chip>
                  </View>
                  <View style={styles.inviteActions}>
                    {invite.isValid && (
                      <>
                        <IconButton
                          icon="content-copy"
                          size={20}
                          iconColor={Colors.textSecondary}
                          onPress={() =>
                            handleCopyCode(
                              invite.code,
                              invite.groupId?.name || 'Our Club'
                            )
                          }
                        />
                        <IconButton
                          icon="share-variant"
                          size={20}
                          iconColor={Colors.textSecondary}
                          onPress={() =>
                            handleShareCode(
                              invite.code,
                              invite.groupId?.name || 'Our Club'
                            )
                          }
                        />
                      </>
                    )}
                  </View>
                </View>

                <Divider style={styles.inviteDivider} />

                <View style={styles.inviteDetails}>
                  <View style={styles.inviteDetail}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.inviteDetailText}>
                      {invite.groupId?.name || 'No group'}
                      {invite.groupId?.ageGroup && ` (${invite.groupId.ageGroup})`}
                    </Text>
                  </View>
                  <View style={styles.inviteDetail}>
                    <MaterialCommunityIcons
                      name="account-multiple-check"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.inviteDetailText}>
                      {invite.usedCount} / {invite.maxUses} used
                    </Text>
                  </View>
                  <View style={styles.inviteDetail}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={16}
                      color={
                        isExpired(invite.expiresAt)
                          ? Colors.error
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.inviteDetailText,
                        isExpired(invite.expiresAt) && { color: Colors.error },
                      ]}
                    >
                      {isExpired(invite.expiresAt)
                        ? 'Expired'
                        : `Expires ${formatDate(invite.expiresAt)}`}
                    </Text>
                  </View>
                </View>

                {invite.isValid && (
                  <Button
                    mode="text"
                    textColor={Colors.error}
                    onPress={() => handleDeactivateCode(invite.code)}
                    style={styles.deactivateButton}
                    compact
                  >
                    Deactivate
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  generateCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  groupSelector: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dropdownButton: {
    borderColor: Colors.border,
  },
  dropdownContent: {
    justifyContent: 'flex-start',
  },
  menuContent: {
    backgroundColor: Colors.surface,
  },
  menuItemTitle: {
    color: Colors.text,
  },
  menuItemDisabled: {
    color: Colors.textSecondary,
  },
  generateButton: {
    backgroundColor: Colors.primary,
  },
  noGroupsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noGroupsText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  noGroupsSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  createGroupButton: {
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  codeCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  codeSuccessText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.success,
  },
  codeDisplay: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  codeText: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  codeInfo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  codeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  existingSection: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  inviteCard: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.sm,
  },
  inviteCardInactive: {
    opacity: 0.6,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inviteCode: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  statusChip: {
    height: 24,
  },
  statusChipActive: {
    backgroundColor: Colors.success + '30',
  },
  statusChipInactive: {
    backgroundColor: Colors.error + '30',
  },
  statusChipText: {
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  inviteActions: {
    flexDirection: 'row',
  },
  inviteDivider: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  inviteDetails: {
    gap: Spacing.xs,
  },
  inviteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inviteDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  deactivateButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
});
