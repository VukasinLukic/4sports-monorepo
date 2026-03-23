import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Chip, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}

export default function CreatePostScreen() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        quality: 0.7, // Reduce quality to ensure smaller file sizes
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => {
          const mimeType = asset.mimeType || 'image/jpeg';
          const ext = mimeType === 'image/heic' || mimeType === 'image/heif' ? 'heic' : 'jpg';
          return {
            uri: asset.uri,
            type: mimeType,
            name: asset.fileName || `image_${Date.now()}_${index}.${ext}`,
          };
        });

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
    if (!title.trim()) {
      Alert.alert(t('common.error'), 'Please enter a title for your post.');
      return false;
    }
    if (title.trim().length > 200) {
      Alert.alert(t('common.error'), 'Title must be less than 200 characters.');
      return false;
    }
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('validation.enterContent') || 'Please enter some content for your post.');
      return false;
    }
    if (content.trim().length < 3) {
      Alert.alert(t('common.error'), t('validation.contentMinLength') || 'Post content must be at least 3 characters.');
      return false;
    }
    if (content.trim().length > 5000) {
      Alert.alert(t('common.error'), 'Content must be less than 5000 characters.');
      return false;
    }
    return true;
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    try {
      const formData = new FormData();

      // Append all images with correct React Native format
      selectedImages.forEach((image) => {
        // React Native FormData expects this specific format
        const imageFile = {
          uri: image.uri,
          name: image.name,
          type: image.type,
        };

        // @ts-ignore - React Native FormData typing
        formData.append('images', imageFile);
      });

      console.log('Uploading images:', selectedImages.length);

      const response = await api.post('/upload/post-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.data?.urls) {
        return response.data.data.urls;
      }

      return [];
    } catch (error: any) {
      console.error('Error uploading images:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(t('common.error'), 'Failed to upload images. Post will be created without images.');
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Upload images first if any are selected
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        console.log('Attempting to upload images...');
        try {
          imageUrls = await uploadImages();
          console.log('Images uploaded successfully:', imageUrls);
        } catch (uploadError) {
          console.error('Image upload failed, continuing without images:', uploadError);
          // Continue without images instead of failing the entire post
        }
      }

      console.log('Creating post...');
      // Create post with correct API structure
      const postData = {
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
        visibility: 'PUBLIC',
      };

      console.log('Post data:', postData);
      await api.post('/posts', postData);

      Alert.alert(t('common.success'), t('news.postSuccess') || 'Post created successfully!', [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert(
        t('common.error'),
        error.response?.data?.error?.message || error.response?.data?.message || t('news.postFailed') || 'Failed to create post. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.label}>{t('news.postTitle')} *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Enter post title..."
        mode="outlined"
        maxLength={200}
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Content */}
      <Text style={styles.label}>{t('news.postContent')} *</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder={t('news.postPlaceholder')}
        mode="outlined"
        multiline
        numberOfLines={6}
        maxLength={5000}
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
            {t('news.visibleToAll')}
          </Text>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !title.trim() || !content.trim()}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 150,
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
