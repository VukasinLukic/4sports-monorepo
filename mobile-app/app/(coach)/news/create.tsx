import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Chip, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';
import { Group } from '@/types';

interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}

export default function CreatePostScreen() {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('news.permissionRequired') || 'Permission Required',
          t('news.allowPhotoAccess') || 'Please allow access to your photo library to add images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));

        // Limit to 5 images total
        const totalImages = [...selectedImages, ...newImages].slice(0, 5);
        setSelectedImages(totalImages);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert(t('common.error'), t('news.failedPickImages') || 'Failed to pick images. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('validation.enterContent') || 'Please enter some content for your post.');
      return false;
    }
    if (content.trim().length < 3) {
      Alert.alert(t('common.error'), t('validation.contentMinLength') || 'Post content must be at least 3 characters.');
      return false;
    }
    return true;
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const image of selectedImages) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.data?.url) {
          uploadedUrls.push(response.data.data.url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue with other images
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Upload images first
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        mediaUrls = await uploadImages();
      }

      // Create post
      await api.post('/posts', {
        content: content.trim(),
        groupId: selectedGroupId || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      Alert.alert(t('common.success'), t('news.postSuccess') || 'Post created successfully!', [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('news.postFailed') || 'Failed to create post. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Group Selection */}
      <Text style={styles.label}>{t('news.postToGroup')} ({t('common.optional')})</Text>
      {isLoadingGroups ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
          <View style={styles.groupContainer}>
            <Chip
              selected={selectedGroupId === null}
              onPress={() => setSelectedGroupId(null)}
              style={styles.groupChip}
              selectedColor={Colors.primary}
            >
              {t('news.allMembers')}
            </Chip>
            {groups.map(group => (
              <Chip
                key={group._id}
                selected={selectedGroupId === group._id}
                onPress={() => setSelectedGroupId(group._id)}
                style={styles.groupChip}
                selectedColor={Colors.primary}
              >
                {group.name}
              </Chip>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Content */}
      <Text style={styles.label}>{t('news.whatsOnYourMind')} *</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder={t('news.postPlaceholder')}
        mode="outlined"
        multiline
        numberOfLines={6}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Image Picker */}
      <Text style={styles.label}>{t('news.addPhotos')} ({t('common.optional')})</Text>
      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={pickImages}
        disabled={selectedImages.length >= 5}
      >
        <MaterialCommunityIcons name="image-plus" size={24} color={Colors.primary} />
        <Text style={styles.imagePickerText}>
          {selectedImages.length >= 5
            ? t('news.maxImages')
            : `${t('news.addImagesCount')} (${selectedImages.length}/5)`}
        </Text>
      </TouchableOpacity>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
          <View style={styles.imagePreviewContainer}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <MaterialCommunityIcons name="information" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            {selectedGroupId
              ? t('news.visibleToGroup')
              : t('news.visibleToAll')}
          </Text>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !content.trim()}
        style={styles.submitButton}
        icon="send"
        buttonColor={Colors.primary}
      >
        {t('news.post')}
      </Button>

      {/* Cancel Button */}
      <Button
        mode="outlined"
        onPress={() => router.back()}
        style={styles.cancelButton}
        textColor={Colors.textSecondary}
      >
        {t('common.cancel')}
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
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  groupScroll: {
    maxHeight: 50,
  },
  groupContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  groupChip: {
    backgroundColor: Colors.surface,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  imagePickerText: {
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  imagePreviewScroll: {
    marginTop: Spacing.md,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: Colors.info + '10',
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    borderColor: Colors.border,
  },
});
