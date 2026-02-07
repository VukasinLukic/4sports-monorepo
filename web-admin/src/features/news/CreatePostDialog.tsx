import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePost, useUploadPostImages } from './usePosts';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createPostMutation = useCreatePost();
  const uploadImagesMutation = useUploadPostImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'MEMBERS_ONLY' as const,
    type: 'NEWS' as const,
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = createPostMutation.isPending || uploadImagesMutation.isPending;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    } else if (formData.title.length > 200) {
      newErrors.title = t('validation.titleMaxLength');
    }

    if (!formData.content.trim()) {
      newErrors.content = t('validation.contentRequired');
    } else if (formData.content.length > 5000) {
      newErrors.content = t('validation.contentMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = [...selectedImages, ...newFiles].slice(0, 5);

    setSelectedImages(totalFiles);

    // Create preview URLs
    const newPreviewUrls = totalFiles.map((file) => URL.createObjectURL(file));
    // Cleanup old preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(newPreviewUrls);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);

    // Update preview URLs
    URL.revokeObjectURL(previewUrls[index]);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let imageUrls: string[] = [];

      // Upload images first if any are selected
      if (selectedImages.length > 0) {
        try {
          imageUrls = await uploadImagesMutation.mutateAsync(selectedImages);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: t('common.warning'),
            description: t('errors.uploadImages'),
            variant: 'destructive',
          });
        }
      }

      // Create the post
      await createPostMutation.mutateAsync({
        title: formData.title.trim(),
        content: formData.content.trim(),
        images: imageUrls,
        visibility: formData.visibility,
        type: formData.type,
      });

      toast({
        title: t('common.success'),
        description: t('news.postCreated'),
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      setErrors({
        submit: error.response?.data?.error?.message || 'Failed to create post',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      visibility: 'MEMBERS_ONLY',
      type: 'NEWS',
    });
    setSelectedImages([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setErrors({});
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('news.createNewPost')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                {t('news.postTitle')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('news.titlePlaceholder')}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200
              </p>
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">
                {t('news.content')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder={t('news.contentPlaceholder')}
                className="min-h-[150px]"
                maxLength={5000}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/5000
              </p>
            </div>

            {/* Images */}
            <div className="grid gap-2">
              <Label>{t('news.imagesOptional')}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedImages.length >= 5}
                className="w-full border-dashed"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {selectedImages.length >= 5
                  ? t('news.maxImages')
                  : t('news.addImages', { count: selectedImages.length })}
              </Button>

              {/* Image previews */}
              {previewUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="grid gap-2">
              <Label htmlFor="visibility">{t('news.visibilityLabel')}</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => handleChange('visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">{t('news.visibilityPublic')}</SelectItem>
                  <SelectItem value="MEMBERS_ONLY">{t('news.visibilityMembers')}</SelectItem>
                  <SelectItem value="PARENTS_ONLY">{t('news.visibilityParents')}</SelectItem>
                  <SelectItem value="COACHES_ONLY">{t('news.visibilityCoaches')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">{t('news.postType')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWS">{t('news.typeNews')}</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">{t('news.typeAnnouncement')}</SelectItem>
                  <SelectItem value="EVENT">{t('news.typeEvent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errors.submit && (
              <p className="text-sm text-red-500">{errors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.creating')}
                </>
              ) : (
                t('news.createPost')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
