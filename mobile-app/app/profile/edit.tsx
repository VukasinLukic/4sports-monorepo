import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Avatar, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import { Member } from '@/types';
import api from '@/services/api';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Member-specific fields
  const [member, setMember] = useState<Member | null>(null);
  const [membershipFee, setMembershipFee] = useState('3000');
  const [isLoadingMember, setIsLoadingMember] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    try {
      const response = await api.get('/members/me');
      const memberData = response.data.data;
      setMember(memberData);
      if (memberData.membershipFee) {
        setMembershipFee(String(memberData.membershipFee));
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setIsLoadingMember(false);
    }
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

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to change your profile picture.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploadingImage(true);
    try {
      // Create form data for image upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      // Upload image to backend
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data?.url) {
        setProfileImage(response.data.data.url);
      } else {
        // For now, just use the local URI as preview
        setProfileImage(uri);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Still show local preview even if upload fails
      setProfileImage(uri);
      Alert.alert(
        'Upload Notice',
        'Image selected but upload to server may have failed. The image will be saved when you update your profile.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return false;
    }
    if (fullName.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updates: any = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profilePicture: profileImage || undefined,
      };

      await api.patch(`/users/${user?._id}`, updates);

      // If membership fee changed, update member
      if (member && member.membershipFee !== parseInt(membershipFee)) {
        await api.patch(`/members/${member._id}`, {
          membershipFee: parseInt(membershipFee),
        });
      }

      // Refresh user data in context
      if (refreshUser) {
        await refreshUser();
      }

      await fetchMemberData();

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Picture */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} disabled={isUploadingImage}>
          {profileImage ? (
            <Avatar.Image
              size={100}
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={100}
              label={getInitials(fullName || user?.fullName)}
              style={styles.avatar}
            />
          )}
          <View style={styles.cameraIcon}>
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <MaterialCommunityIcons name="camera" size={20} color={Colors.text} />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </View>

      {/* Full Name */}
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your full name"
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
        left={<TextInput.Icon icon="account" />}
      />

      {/* Email (Read-only) */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={user?.email || ''}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        textColor={Colors.textSecondary}
        disabled
        left={<TextInput.Icon icon="email" />}
      />
      <Text style={styles.helperText}>Email cannot be changed</Text>

      {/* Phone Number */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter your phone number"
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
        left={<TextInput.Icon icon="phone" />}
      />

      {/* Member & Membership Section */}
      {!isLoadingMember && member && (
        <>
          <Divider style={styles.divider} />
          <Text style={[styles.label, { marginTop: Spacing.lg }]}>
            {t('payments.membershipInfo') || 'Membership Info'}
          </Text>

          {/* Monthly Fee */}
          <Text style={styles.label}>{t('payments.monthlyFee') || 'Monthly Fee (RSD)'}</Text>
          <TextInput
            value={membershipFee}
            onChangeText={setMembershipFee}
            placeholder="3000"
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            textColor={Colors.text}
            placeholderTextColor={Colors.textSecondary}
            left={<TextInput.Icon icon="cash" />}
          />
          <Text style={styles.helperText}>{t('payments.monthlyFeeHelper') || 'Monthly membership fee for this member'}</Text>
        </>
      )}

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        loading={isLoading}
        disabled={isLoading || isUploadingImage}
        style={styles.saveButton}
        icon="check"
        buttonColor={Colors.primary}
      >
        Save Changes
      </Button>

      {/* Cancel Button */}
      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        Cancel
      </Button>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  changePhotoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
  divider: {
    marginVertical: Spacing.lg,
    backgroundColor: Colors.border,
  },
});
