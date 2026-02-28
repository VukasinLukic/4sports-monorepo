import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useClubSettings,
  useUpdateClubSettings,
  useUserProfile,
  useUpdateUserProfile,
  useSubscription,
} from './useSettings';
import { changePassword } from '@/services/auth';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Building2, User, CreditCard, Save, Key, Globe, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/context/OnboardingContext';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { checkAndStartTutorial } = useOnboarding();
  const { toast } = useToast();

  // Club Settings State
  const { data: clubSettings, isLoading: clubLoading } = useClubSettings();
  const [clubName, setClubName] = useState(clubSettings?.clubName || '');
  const [address, setAddress] = useState(clubSettings?.address || '');
  const [clubPhone, setClubPhone] = useState(clubSettings?.phoneNumber || '');
  const [clubEmail, setClubEmail] = useState(clubSettings?.email || '');

  // User Profile State
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [userPhone, setUserPhone] = useState(userProfile?.phoneNumber || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Subscription
  const { data: subscription, isLoading: subLoading } = useSubscription();

  // Mutations
  const updateClubMutation = useUpdateClubSettings();
  const updateProfileMutation = useUpdateUserProfile();

  // Start tutorial on first visit
  useEffect(() => {
    if (!clubLoading && !profileLoading && !subLoading) {
      checkAndStartTutorial('settings');
    }
  }, [clubLoading, profileLoading, subLoading, checkAndStartTutorial]);

  // Update state when data loads
  if (clubSettings && !clubName) {
    setClubName(clubSettings.clubName);
    setAddress(clubSettings.address);
    setClubPhone(clubSettings.phoneNumber);
    setClubEmail(clubSettings.email);
  }

  if (userProfile && !fullName) {
    setFullName(userProfile.fullName);
    setUserPhone(userProfile.phoneNumber);
  }

  const handleSaveClubSettings = async () => {
    try {
      await updateClubMutation.mutateAsync({
        clubName,
        address,
        phoneNumber: clubPhone,
        email: clubEmail,
      });
      toast({
        title: t('common.success'),
        description: t('settings.clubSaved'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.clubSaveFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName,
        phoneNumber: userPhone,
      });
      toast({
        title: t('common.success'),
        description: t('settings.profileSaved'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.profileSaveFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t('common.error'), description: t('auth.passwordMin'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: t('common.error'), description: t('auth.passwordsNoMatch'), variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({ title: t('common.success'), description: t('settings.passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      const isWrongPassword =
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential';
      toast({
        title: t('common.error'),
        description: isWrongPassword
          ? t('settings.wrongCurrentPassword')
          : t('settings.passwordChangeFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (clubLoading || profileLoading || subLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'secondary';
      case 'BASIC':
        return 'default';
      case 'PRO':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="club" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="club">
            <Building2 className="mr-2 h-4 w-4" />
            {t('settings.clubSettings')}
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {t('settings.myProfile')}
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4 " />
            {t('settings.subscription')}
          </TabsTrigger>
        </TabsList>

        {/* Club Settings Tab */}
        <TabsContent value="club" className="space-y-4">
          <Card data-tour="club-settings">
            <CardHeader>
              <CardTitle>{t('settings.clubInformation')}</CardTitle>
              <CardDescription>
                {t('settings.clubInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clubName">{t('settings.clubName')}</Label>
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder={t('settings.enterClubName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('settings.address')}</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('settings.enterAddress')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubPhone">{t('settings.phoneNumber')}</Label>
                  <Input
                    id="clubPhone"
                    value={clubPhone}
                    onChange={(e) => setClubPhone(e.target.value)}
                    placeholder="+381 ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubEmail">{t('settings.emailLabel')}</Label>
                  <Input
                    id="clubEmail"
                    type="email"
                    value={clubEmail}
                    onChange={(e) => setClubEmail(e.target.value)}
                    placeholder="info@club.com"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveClubSettings}
                className="bg-green-600 hover:bg-green-700"
                disabled={updateClubMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {/* Personal Info */}
          <Card data-tour="profile-settings">
            <CardHeader>
              <CardTitle>{t('settings.personalInfo')}</CardTitle>
              <CardDescription>{t('settings.personalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('settings.enterFullName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPhone">{t('settings.phoneNumber')}</Label>
                  <Input
                    id="userPhone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+381 ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">{t('settings.emailLabel')}</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.emailCannotChange')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.role')}</Label>
                  <div className="flex items-center h-10">
                    <Badge variant="secondary" className="uppercase">
                      {userProfile?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="bg-green-600 hover:bg-green-700"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password — collapsible */}
          <Card>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setPasswordOpen(v => !v)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-5 w-5" />
                  {t('settings.changePassword')}
                </CardTitle>
                {passwordOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
            </button>
            {passwordOpen && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">{t('settings.confirmNewPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.saveChanges')}
                </Button>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card data-tour="subscription">
            <CardHeader>
              <CardTitle>{t('settings.subscriptionPlan')}</CardTitle>
              <CardDescription>
                {t('settings.subscriptionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.currentPlan')}</Label>
                <div>
                  <Badge
                    variant={getPlanBadgeVariant(subscription?.plan || 'FREE')}
                    className="text-lg px-4 py-2"
                  >
                    {subscription?.plan} {t('settings.planLabel')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.memberLimit')}</Label>
                  <div className="text-2xl font-bold">
                    {subscription?.memberLimit}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.currentMembers')}</Label>
                  <div className="text-2xl font-bold">
                    {subscription?.currentMembersCount}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.usage')}</Label>
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all"
                    style={{
                      width: `${((subscription?.currentMembersCount || 0) /
                        (subscription?.memberLimit || 1)) *
                        100
                        }%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.membersUsed', { current: subscription?.currentMembersCount, limit: subscription?.memberLimit })}
                </p>
              </div>

              <Button variant="outline" disabled>
                {t('settings.upgradePlan')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mt-0">
            <Globe className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>{t('settings.languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={i18n.language === 'sr' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('sr')}
              className={i18n.language === 'sr' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              🇷🇸 Srpski
            </Button>
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => i18n.changeLanguage('en')}
              className={i18n.language === 'en' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              🇬🇧 English
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
