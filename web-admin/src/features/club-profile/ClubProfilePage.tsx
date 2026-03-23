import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useClubSettings, useUpdateClubSettings } from '@/features/settings/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import {
  Building2,
  MapPin,
  Calendar,
  Trophy,
  Shield,
  PencilIcon,
  Save,
  X,
  Upload,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export function ClubProfilePage() {
  const { t } = useTranslation();
  const { data: clubSettings, isLoading } = useClubSettings();
  const updateSettings = useUpdateClubSettings();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    clubName: '',
    address: '',
    phoneNumber: '',
    email: '',
    logoUrl: '',
    foundedYear: '',
    stadium: '',
    clubColors: '',
    description: '',
    history: '',
    achievements: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
  });

  // Upload logo mutation
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('images', file);

      const response = await api.post<{ success: boolean; data: { urls: string[] } }>(
        '/upload/club-logo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data.urls[0];
    },
  });

  const handleEdit = () => {
    if (clubSettings) {
      setFormData({
        clubName: clubSettings.clubName || '',
        address: clubSettings.address || '',
        phoneNumber: clubSettings.phoneNumber || '',
        email: clubSettings.email || '',
        logoUrl: clubSettings.logoUrl || '',
        foundedYear: (clubSettings as any).foundedYear || '',
        stadium: (clubSettings as any).stadium || '',
        clubColors: (clubSettings as any).clubColors || '',
        description: (clubSettings as any).description || '',
        history: (clubSettings as any).history || '',
        achievements: (clubSettings as any).achievements || '',
        website: (clubSettings as any).website || '',
        facebook: (clubSettings as any).facebook || '',
        instagram: (clubSettings as any).instagram || '',
        twitter: (clubSettings as any).twitter || '',
      });
      setPreviewUrl(clubSettings.logoUrl || '');
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      let logoUrl = formData.logoUrl;

      // Upload logo if a new file was selected
      if (selectedFile) {
        try {
          logoUrl = await uploadLogo.mutateAsync(selectedFile);
        } catch (error) {
          toast({
            title: t('common.error'),
            description: t('clubProfile.logoUploadFailed'),
            variant: 'destructive',
          });
          return;
        }
      }

      await updateSettings.mutateAsync({
        clubName: formData.clubName,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        logoUrl,
        ...(formData.foundedYear && { foundedYear: formData.foundedYear }),
        ...(formData.stadium && { stadium: formData.stadium }),
        ...(formData.clubColors && { clubColors: formData.clubColors }),
        ...(formData.description && { description: formData.description }),
        ...(formData.history && { history: formData.history }),
        ...(formData.achievements && { achievements: formData.achievements }),
        ...(formData.website && { website: formData.website }),
        ...(formData.facebook && { facebook: formData.facebook }),
        ...(formData.instagram && { instagram: formData.instagram }),
        ...(formData.twitter && { twitter: formData.twitter }),
      } as any);
      toast({
        title: t('common.success'),
        description: t('clubProfile.updateSuccess'),
        variant: 'success',
      });
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('clubProfile.updateFailed'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayData = {
    clubName: clubSettings?.clubName || '',
    address: clubSettings?.address || '',
    phoneNumber: clubSettings?.phoneNumber || '',
    email: clubSettings?.email || '',
    logoUrl: clubSettings?.logoUrl || '',
    foundedYear: (clubSettings as any)?.foundedYear || '',
    stadium: (clubSettings as any)?.stadium || '',
    clubColors: (clubSettings as any)?.clubColors || '',
    description: (clubSettings as any)?.description || '',
    history: (clubSettings as any)?.history || '',
    achievements: (clubSettings as any)?.achievements || '',
    website: (clubSettings as any)?.website || '',
    facebook: (clubSettings as any)?.facebook || '',
    instagram: (clubSettings as any)?.instagram || '',
    twitter: (clubSettings as any)?.twitter || '',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('clubProfile.title')}</h1>
          <p className="text-muted-foreground">{t('clubProfile.subtitle')}</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700">
            <PencilIcon className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline">
              <X className="mr-2 h-4 w-4" />
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>

      {/* Hero Section - Club Logo & Name */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Logo */}
            <div className="relative">
              {isEditing ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={handleLogoClick}
                    className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-green-600 transition-colors cursor-pointer group"
                  >
                    {previewUrl || formData.logoUrl ? (
                      <img
                        src={previewUrl || formData.logoUrl}
                        alt="Club logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-green-600 transition-colors">
                        <Upload className="h-12 w-12" />
                        <span className="text-xs text-center px-2">{t('clubProfile.uploadLogo')}</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLogoClick}
                    className="w-full"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {selectedFile ? t('clubProfile.changeLogo') : t('clubProfile.selectLogo')}
                  </Button>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground text-center truncate w-full">
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden shadow-xl">
                  {displayData.logoUrl ? (
                    <img
                      src={displayData.logoUrl}
                      alt="Club logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield className="h-20 w-20 text-white" />
                  )}
                </div>
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <Input
                  className="text-4xl font-bold mb-2"
                  value={formData.clubName}
                  onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  placeholder={t('clubProfile.clubName')}
                />
              ) : (
                <h2 className="text-4xl font-bold mb-2">{displayData.clubName || t('clubProfile.clubName')}</h2>
              )}

              {isEditing ? (
                <Textarea
                  className="mt-2"
                  placeholder={t('clubProfile.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              ) : displayData.description ? (
                <p className="text-muted-foreground text-lg">{displayData.description}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('clubProfile.noDescription')}</p>
              )}

              {/* Quick Stats */}
              {!isEditing && (
                <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                  {displayData.foundedYear && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{t('clubProfile.founded')}: {displayData.foundedYear}</span>
                    </div>
                  )}
                  {displayData.stadium && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{displayData.stadium}</span>
                    </div>
                  )}
                  {displayData.clubColors && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border-2 border-border" style={{ backgroundColor: displayData.clubColors }} />
                      <span className="font-medium">{t('clubProfile.clubColors')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Location */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                {t('clubProfile.contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t('clubProfile.address')}</label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('clubProfile.address')}
                  />
                ) : (
                  <p className="font-medium">{displayData.address || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('clubProfile.phone')}</label>
                {isEditing ? (
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder={t('clubProfile.phone')}
                  />
                ) : (
                  <p className="font-medium">{displayData.phoneNumber || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('clubProfile.email')}</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('clubProfile.email')}
                  />
                ) : (
                  <p className="font-medium">{displayData.email || '-'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                {t('clubProfile.socialMedia')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('clubProfile.website')}
                </label>
                {isEditing ? (
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                ) : displayData.website ? (
                  <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium block truncate">
                    {displayData.website}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </label>
                {isEditing ? (
                  <Input
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="facebook.com/..."
                  />
                ) : displayData.facebook ? (
                  <a href={displayData.facebook} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium block truncate">
                    {displayData.facebook}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </label>
                {isEditing ? (
                  <Input
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="instagram.com/..."
                  />
                ) : displayData.instagram ? (
                  <a href={displayData.instagram} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium block truncate">
                    {displayData.instagram}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </label>
                {isEditing ? (
                  <Input
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="twitter.com/..."
                  />
                ) : displayData.twitter ? (
                  <a href={displayData.twitter} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium block truncate">
                    {displayData.twitter}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Club Details */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  {t('clubProfile.clubDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">{t('clubProfile.foundedYear')}</label>
                    <Input
                      value={formData.foundedYear}
                      onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t('clubProfile.stadium')}</label>
                    <Input
                      value={formData.stadium}
                      onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                      placeholder={t('clubProfile.stadium')}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t('clubProfile.clubColors')}</label>
                    <Input
                      type="color"
                      value={formData.clubColors}
                      onChange={(e) => setFormData({ ...formData, clubColors: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                {t('clubProfile.history')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.history}
                  onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                  placeholder={t('clubProfile.historyPlaceholder')}
                  rows={6}
                />
              ) : displayData.history ? (
                <p className="text-foreground whitespace-pre-line">{displayData.history}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('clubProfile.noHistory')}</p>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                {t('clubProfile.achievements')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  placeholder={t('clubProfile.achievementsPlaceholder')}
                  rows={6}
                />
              ) : displayData.achievements ? (
                <p className="text-foreground whitespace-pre-line">{displayData.achievements}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('clubProfile.noAchievements')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
