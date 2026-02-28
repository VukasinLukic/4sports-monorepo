import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { Spacing, FontSize } from '@/constants/Layout';
import { useAuth } from '@/services/AuthContext';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePicture || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired') || 'Permission Required',
          t('profile.photoPermission') || 'Please allow access to your photo library to change your profile picture.'
        );
        return;
      }

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
      Alert.alert(t('common.error') || 'Error', t('profile.pickImageError') || 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data?.url) {
        setProfileImage(response.data.data.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('profile.uploadError') || 'Image upload failed. Please try again.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert(t('common.validationError') || 'Validation Error', t('profile.nameRequired') || 'Please enter your full name.');
      return false;
    }
    if (fullName.trim().length < 2) {
      Alert.alert(t('common.validationError') || 'Validation Error', t('profile.nameTooShort') || 'Name must be at least 2 characters.');
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
        profileImage: profileImage || undefined,
      };

      await api.put('/settings/profile', updates);

      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert(t('common.success') || 'Success', t('profile.updateSuccess') || 'Profile updated successfully!', [
        { text: t('common.ok') || 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error.response?.data?.message || t('profile.updateError') || 'Failed to update profile. Please try again.'
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
        <Text style={styles.changePhotoText}>{t('profile.tapToChangePhoto') || 'Tap to change photo'}</Text>
      </View>

      {/* Full Name */}
      <Text style={styles.label}>{t('profile.fullName') || 'Full Name'} *</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder={t('profile.fullNamePlaceholder') || 'Enter your full name'}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
        left={<TextInput.Icon icon="account" />}
      />

      {/* Email (Read-only) */}
      <Text style={styles.label}>{t('profile.email') || 'Email'}</Text>
      <TextInput
        value={user?.email || ''}
        mode="outlined"
        style={styles.input}
        outlineColor={Colors.border}
        textColor={Colors.textSecondary}
        disabled
        left={<TextInput.Icon icon="email" />}
      />
      <Text style={styles.helperText}>{t('profile.emailCannotChange') || 'Email cannot be changed'}</Text>

      {/* Phone Number */}
      <Text style={styles.label}>{t('profile.phoneNumber') || 'Phone Number'}</Text>
      <TextInput
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder={t('profile.phoneNumberPlaceholder') || 'Enter your phone number'}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
        left={<TextInput.Icon icon="phone" />}
      />

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
        {t('common.saveChanges') || 'Save Changes'}
      </Button>

      {/* Cancel Button */}
      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        {t('common.cancel') || 'Cancel'}
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
});
