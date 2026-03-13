import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize } from '@/constants/Layout';
import { useLanguage } from '@/services/LanguageContext';
import api from '@/services/api';

interface NewImage {
  uri: string;
  type: string;
  name: string;
}

export default function EditPostScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ postId: string; title?: string; content?: string; images?: string }>();

  const [title, setTitle] = useState(params.title || '');
  const [content, setContent] = useState(params.content || '');
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    try {
      return params.images ? JSON.parse(params.images) : [];
    } catch {
      return [];
    }
  });
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalImageCount = existingImages.length + newImages.length;

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('news.permissionRequired'), t('news.allowPhotoAccess'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5 - totalImageCount,
      });

      if (!result.canceled && result.assets.length > 0) {
        const picked: NewImage[] = result.assets.map((asset, index) => {
          const mimeType = asset.mimeType || 'image/jpeg';
          const ext = mimeType === 'image/heic' || mimeType === 'image/heif' ? 'heic' : 'jpg';
          return {
            uri: asset.uri,
            type: mimeType,
            name: asset.fileName || `image_${Date.now()}_${index}.${ext}`,
          };
        });
        const combined = [...newImages, ...picked].slice(0, 5 - existingImages.length);
        setNewImages(combined);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('news.failedPickImages') || 'Failed to pick images.');
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];
    const formData = new FormData();
    newImages.forEach((image) => {
      // @ts-ignore
      formData.append('images', { uri: image.uri, name: image.name, type: image.type });
    });
    const response = await api.post('/upload/post-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data?.urls || [];
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('validation.enterContent') || 'Please enter some content.');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        try {
          uploadedUrls = await uploadNewImages();
        } catch {
          // continue without new images
        }
      }

      await api.put(`/posts/${params.postId}`, {
        title: title.trim(),
        content: content.trim(),
        images: [...existingImages, ...uploadedUrls],
      });

      Alert.alert(t('common.success'), t('news.postUpdated'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.error?.message || t('errors.generic'));
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
      <Text style={styles.label}>{t('news.postTitle')} *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        maxLength={200}
        style={styles.input}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>{t('news.postContent')} *</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        mode="outlined"
        multiline
        numberOfLines={8}
        maxLength={5000}
        style={[styles.input, styles.textArea]}
        outlineColor={Colors.border}
        activeOutlineColor={Colors.primary}
        textColor={Colors.text}
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Images */}
      <Text style={styles.label}>{t('news.addPhotos')} ({t('common.optional')})</Text>

      {/* Image previews (existing + new) */}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          <View style={styles.imageRow}>
            {existingImages.map((uri, index) => (
              <View key={`existing-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeExistingImage(index)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeNewImage(index)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add images button */}
      <TouchableOpacity
        style={[styles.imagePickerButton, totalImageCount >= 5 && styles.imagePickerDisabled]}
        onPress={pickImages}
        disabled={totalImageCount >= 5}
      >
        <MaterialCommunityIcons name="image-plus" size={22} color={totalImageCount >= 5 ? Colors.textSecondary : Colors.primary} />
        <Text style={[styles.imagePickerText, totalImageCount >= 5 && styles.imagePickerTextDisabled]}>
          {totalImageCount >= 5 ? t('news.maxImages') : `${t('news.addImagesCount')} (${totalImageCount}/5)`}
        </Text>
      </TouchableOpacity>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isLoading}
        disabled={isLoading || !title.trim() || !content.trim()}
        style={styles.saveButton}
        buttonColor={Colors.primary}
        icon="content-save-outline"
      >
        {t('common.saveChanges')}
      </Button>

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
  input: {
    backgroundColor: Colors.surface,
  },
  textArea: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  imageScroll: {
    marginBottom: Spacing.sm,
  },
  imageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
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
    marginTop: Spacing.xs,
  },
  imagePickerDisabled: {
    opacity: 0.5,
  },
  imagePickerText: {
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  imagePickerTextDisabled: {
    color: Colors.textSecondary,
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
