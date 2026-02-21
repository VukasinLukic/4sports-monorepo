import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group } from '@/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InviteCode {
  _id: string;
  code: string;
  type: 'COACH' | 'MEMBER';
  groupId?: {
    _id: string;
    name: string;
    color?: string;
  };
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  isValid: boolean;
  createdAt: string;
}

// Helper to get group color
const getGroupColor = (groupId?: InviteCode['groupId'], groups?: Group[]): string => {
  if (!groupId) return Colors.primary;
  const group = groups?.find(g => g._id === (typeof groupId === 'string' ? groupId : groupId._id));
  return group?.color || groupId.color || Colors.primary;
};

export default function InviteCodesScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ groupId?: string; groupName?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<InviteCode | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showExpiredCodes, setShowExpiredCodes] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Find existing valid code for selected group
  const existingCodeForGroup = useMemo(() => {
    if (!selectedGroup) return null;
    return inviteCodes.find(
      (inv) =>
        inv.groupId &&
        (typeof inv.groupId === 'string' ? inv.groupId : inv.groupId._id) === selectedGroup._id &&
        inv.isValid &&
        inv.isActive
    ) || null;
  }, [selectedGroup, inviteCodes]);

  // Split codes into valid and invalid
  const { validCodes, invalidCodes } = useMemo(() => {
    const valid = inviteCodes.filter(inv => inv.isValid && inv.isActive);
    const invalid = inviteCodes.filter(inv => !inv.isValid || !inv.isActive);
    return { validCodes: valid, invalidCodes: invalid };
  }, [inviteCodes]);

  const toggleExpiredCodes = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowExpiredCodes(!showExpiredCodes);
  };

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        api.get('/groups'),
        api.get('/invites'),
      ]);

      const groupsData = groupsRes.data.data || [];
      setGroups(groupsData);
      setInviteCodes(invitesRes.data.data || []);

      // Pre-select group if passed from params
      if (params.groupId && groupsData.length > 0) {
        const preSelectedGroup = groupsData.find((g: Group) => g._id === params.groupId);
        if (preSelectedGroup) {
          setSelectedGroup(preSelectedGroup);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [params.groupId]);

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
        color: '#22c55e',
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
    return `${t('invites.joinClubMessage') || 'Pridružite se našem klubu u aplikaciji 4Sports!'}\n\n` +
      `${t('groups.group')}: ${groupName}\n` +
      `${t('invites.inviteCode')}: ${code}\n\n` +
      `1. ${t('invites.step1') || 'Preuzmite aplikaciju 4Sports'}\n` +
      `2. ${t('invites.step2') || 'Izaberite "Imam pozivni kod"'}\n` +
      `3. ${t('invites.step3') || 'Unesite kod'}: ${code}\n` +
      `4. ${t('invites.step4') || 'Registrujte se i dodajte svoje dete'}`;
  };

  const handleCopyCode = async (code: string, groupName: string) => {
    const message = getInviteMessage(code, groupName);
    await Clipboard.setStringAsync(message);
    Alert.alert(t('invites.codeCopied'), t('invites.messageCopied') || 'Invite message copied to clipboard');
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
      t('invites.deactivateCode') || 'Deactivate Code',
      t('invites.deactivateConfirm') || 'Are you sure you want to deactivate this invite code?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('invites.deactivate') || 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/invites/${code}`);
              fetchData();
            } catch (error) {
              console.error('Error deactivating code:', error);
              Alert.alert(t('common.error'), t('errors.generic'));
            }
          },
        },
      ]
    );
  };

  const showInstructions = () => {
    setShowInstructionsModal(true);
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
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          <Text style={styles.sectionTitle}>{t('invites.generateCode')}</Text>
          <Text style={styles.sectionDescription}>
            {t('invites.generateDescription') || 'Select a group and generate an invite code that parents can use to register.'}
          </Text>

          {/* No Groups - Create Test Group */}
          {groups.length === 0 ? (
            <View style={styles.noGroupsContainer}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.noGroupsText}>{t('empty.noGroups')}</Text>
              <Text style={styles.noGroupsSubtext}>
                {t('invites.createGroupFirst') || 'Create a group to start generating invite codes'}
              </Text>
              <Button
                mode="contained"
                onPress={handleCreateTestGroup}
                loading={isCreatingGroup}
                disabled={isCreatingGroup}
                style={styles.createGroupButton}
                icon="plus"
              >
                {t('groups.createGroup')}
              </Button>
            </View>
          ) : (
            <>
              {/* Group Selector */}
              <View style={styles.groupSelector}>
                <Text style={styles.label}>{t('groups.selectGroup')}</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setMenuVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownText}>
                    {selectedGroup
                      ? selectedGroup.name
                      : t('groups.selectGroup') + '...'}
                  </Text>
                  <MaterialCommunityIcons name={menuVisible ? "chevron-up" : "chevron-down"} size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Group Selection Modal */}
              <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
              >
                <TouchableOpacity
                  style={styles.dropdownOverlay}
                  activeOpacity={1}
                  onPress={() => setMenuVisible(false)}
                >
                  <View style={styles.dropdownModal}>
                    <Text style={styles.dropdownModalTitle}>{t('groups.selectGroup')}</Text>
                    <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                      {groups.map((group) => (
                        <TouchableOpacity
                          key={group._id}
                          style={[
                            styles.dropdownItem,
                            selectedGroup?._id === group._id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedGroup(group);
                            setGeneratedCode(null);
                            setMenuVisible(false);
                          }}
                        >
                          {group.color && (
                            <View style={[styles.dropdownItemColor, { backgroundColor: group.color }]} />
                          )}
                          <Text style={[
                            styles.dropdownItemText,
                            selectedGroup?._id === group._id && styles.dropdownItemTextSelected,
                          ]}>
                            {group.name}
                          </Text>
                          {selectedGroup?._id === group._id && (
                            <MaterialCommunityIcons name="check" size={20} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Show existing code or generate button */}
              {selectedGroup && existingCodeForGroup ? (
                <View style={styles.existingCodeBox}>
                  <View style={styles.existingCodeHeader}>
                    <Text style={styles.existingCodeLabel}>{t('invites.inviteCode')}</Text>
                    <Text style={styles.existingCodeValue}>{existingCodeForGroup.code}</Text>
                  </View>
                  <View style={styles.existingCodeActions}>
                    <TouchableOpacity
                      style={styles.codeActionButton}
                      onPress={() => handleCopyCode(existingCodeForGroup.code, selectedGroup.name)}
                    >
                      <MaterialCommunityIcons name="content-copy" size={20} color={Colors.primary} />
                      <Text style={styles.codeActionText}>{t('invites.copy') || 'Copy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.codeActionButton}
                      onPress={() => handleShareCode(existingCodeForGroup.code, selectedGroup.name)}
                    >
                      <MaterialCommunityIcons name="share-variant" size={20} color={Colors.primary} />
                      <Text style={styles.codeActionText}>{t('invites.share') || 'Share'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.existingCodeInfo}>
                    {existingCodeForGroup.usedCount}/{existingCodeForGroup.maxUses} {t('invites.used')} • {t('invites.expires')} {formatDate(existingCodeForGroup.expiresAt)}
                  </Text>
                </View>
              ) : selectedGroup ? (
                <Button
                  mode="contained"
                  onPress={handleGenerateCode}
                  loading={isGenerating}
                  disabled={isGenerating}
                  style={styles.generateButton}
                  icon="plus"
                >
                  {t('invites.generateCode')}
                </Button>
              ) : null}
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
              <Text style={styles.codeSuccessText}>{t('invites.codeGenerated')}</Text>
            </View>

            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{generatedCode.code}</Text>
            </View>

            <Text style={styles.codeInfo}>
              {t('groups.group')}: {generatedCode.groupId?.name || 'Unknown'}
            </Text>
            <Text style={styles.codeInfo}>
              {t('invites.maxUses') || 'Max uses'}: {generatedCode.maxUses} | {t('invites.expires') || 'Expires'}: {formatDate(generatedCode.expiresAt)}
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
                {t('invites.copyCode')}
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
                {t('invites.shareCode')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Existing Valid Codes Section */}
      {validCodes.length > 0 && (
        <View style={styles.existingSection}>
          <View style={styles.existingHeader}>
            <Text style={styles.sectionTitle}>{t('invites.existingCodes') || 'Active Invite Codes'}</Text>
            <TouchableOpacity
              style={styles.instructionButton}
              onPress={showInstructions}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.instructionButtonText}>{t('invites.howToUse')}</Text>
            </TouchableOpacity>
          </View>

          {validCodes.map((invite) => {
            const groupColor = getGroupColor(invite.groupId, groups);
            return (
              <View key={invite._id} style={styles.compactInviteCard}>
                {/* Color bar for group */}
                <View style={[styles.compactColorBar, { backgroundColor: groupColor }]} />
                <View style={styles.compactInviteLeft}>
                  <Text style={styles.compactInviteCode}>{invite.code}</Text>
                  <Text style={[styles.compactInviteGroup, { color: groupColor }]}>
                    {invite.groupId?.name || 'No group'}
                  </Text>
                  <Text style={styles.compactInviteInfo}>
                    {invite.usedCount}/{invite.maxUses} • {formatDate(invite.expiresAt)}
                  </Text>
                </View>
                <View style={styles.compactInviteActions}>
                  <IconButton
                    icon="content-copy"
                    size={18}
                    iconColor={Colors.primary}
                    onPress={() => handleCopyCode(invite.code, invite.groupId?.name || 'Our Club')}
                    style={styles.compactIconButton}
                  />
                  <IconButton
                    icon="share-variant"
                    size={18}
                    iconColor={Colors.primary}
                    onPress={() => handleShareCode(invite.code, invite.groupId?.name || 'Our Club')}
                    style={styles.compactIconButton}
                  />
                  <IconButton
                    icon="close-circle-outline"
                    size={18}
                    iconColor={Colors.error}
                    onPress={() => handleDeactivateCode(invite.code)}
                    style={styles.compactIconButton}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Expired/Invalid Codes - Collapsible */}
      {invalidCodes.length > 0 && (
        <View style={styles.expiredSection}>
          <TouchableOpacity
            style={styles.expiredHeader}
            onPress={toggleExpiredCodes}
            activeOpacity={0.7}
          >
            <Text style={styles.expiredHeaderText}>
              {t('invites.expiredCodes') || 'Expired Codes'} ({invalidCodes.length})
            </Text>
            <MaterialCommunityIcons
              name={showExpiredCodes ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {showExpiredCodes && (
            <View style={styles.expiredList}>
              {invalidCodes.map((invite) => (
                <View key={invite._id} style={styles.expiredInviteCard}>
                  <View style={styles.expiredInviteLeft}>
                    <Text style={styles.expiredInviteCode}>{invite.code}</Text>
                    <Text style={styles.expiredInviteGroup}>
                      {invite.groupId?.name || 'No group'}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={styles.expiredChip}
                    textStyle={styles.expiredChipText}
                  >
                    {isExpired(invite.expiresAt) ? t('status.expired') : t('status.inactive')}
                  </Chip>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Empty State */}
      {inviteCodes.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <MaterialCommunityIcons
              name="ticket-outline"
              size={48}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>{t('invites.noInvites')}</Text>
            <Text style={styles.emptySubtext}>
              {t('invites.noInvitesDescription')}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Instructions Modal */}
      <Modal
        visible={showInstructionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInstructionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInstructionsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="help-circle" size={28} color={Colors.primary} />
              <Text style={styles.modalTitle}>{t('invites.howToUse') || 'How to use'}</Text>
            </View>

            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  {t('invites.step1') || 'Download the 4Sports app'}
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  {t('invites.step2') || 'Choose "I have an invite code"'}
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  {t('invites.step3') || 'Enter the code'}
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  {t('invites.step4') || 'Register and add your child'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInstructionsModal(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.ok') || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dropdownModal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 340,
    maxHeight: '70%',
  },
  dropdownModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + '10',
  },
  dropdownItemColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
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
  existingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  instructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  instructionButtonText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  existingCodeBox: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  existingCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  existingCodeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  existingCodeValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  existingCodeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    flex: 1,
    justifyContent: 'center',
  },
  codeActionText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  existingCodeInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  compactInviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    paddingLeft: Spacing.lg,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  compactColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  compactInviteLeft: {
    flex: 1,
  },
  compactInviteCode: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 1,
  },
  compactInviteGroup: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  compactInviteInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  compactInviteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIconButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  expiredSection: {
    marginTop: Spacing.lg,
  },
  expiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expiredHeaderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  expiredList: {
    marginTop: Spacing.sm,
  },
  expiredInviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  expiredInviteLeft: {
    flex: 1,
  },
  expiredInviteCode: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  expiredInviteGroup: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expiredChip: {
    backgroundColor: Colors.error + '20',
    height: 24,
  },
  expiredChipText: {
    fontSize: FontSize.xs,
    color: Colors.error,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
