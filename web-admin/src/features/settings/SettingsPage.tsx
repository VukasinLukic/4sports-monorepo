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
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Building2, User, CreditCard, Save, Key, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HelpButton } from '@/components/shared/HelpButton';
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

  const handleChangePassword = () => {
    toast({
      title: t('settings.passwordReset'),
      description: t('settings.passwordResetDescription'),
    });
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
    <div className="space-y-6">
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
            <CreditCard className="mr-2 h-4 w-4" />
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
          <Card data-tour="profile-settings">
            <CardHeader>
              <CardTitle>{t('settings.personalInfo')}</CardTitle>
              <CardDescription>{t('settings.personalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="userPhone">{t('settings.phoneNumber')}</Label>
                <Input
                  id="userPhone"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+381 ..."
                />
              </div>

              <div className="space-y-2">
                <Label>{t('settings.role')}</Label>
                <div>
                  <Badge variant="secondary" className="uppercase">
                    {userProfile?.role}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.saveChanges')}
                </Button>

                <Button onClick={handleChangePassword} variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  {t('settings.changePassword')}
                </Button>
              </div>
            </CardContent>
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
                      width: `${
                        ((subscription?.currentMembersCount || 0) /
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
          <CardTitle className="flex items-center gap-2">
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

      <HelpButton pageKey="settings" />
    </div>
  );
}
