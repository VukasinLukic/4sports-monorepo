import { useState, useEffect } from 'react';
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
import { Building2, User, CreditCard, Save, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HelpButton } from '@/components/shared/HelpButton';
import { useOnboarding } from '@/context/OnboardingContext';

export function SettingsPage() {
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
        title: 'Uspešno',
        description: 'Podešavanja kluba su ažurirana',
      });
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće sačuvati podešavanja',
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
        title: 'Uspešno',
        description: 'Profil je ažuriran',
      });
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće sačuvati profil',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = () => {
    toast({
      title: 'Password Reset',
      description: 'Password reset email sent (feature coming soon)',
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your club settings and profile</p>
      </div>

      <Tabs defaultValue="club" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="club">
            <Building2 className="mr-2 h-4 w-4" />
            Club Settings
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        {/* Club Settings Tab */}
        <TabsContent value="club" className="space-y-4">
          <Card data-tour="club-settings">
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
              <CardDescription>
                Update your club's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clubName">Club Name</Label>
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter club name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter club address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubPhone">Phone Number</Label>
                  <Input
                    id="clubPhone"
                    value={clubPhone}
                    onChange={(e) => setClubPhone(e.target.value)}
                    placeholder="+381 ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubEmail">Email</Label>
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
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card data-tour="profile-settings">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPhone">Phone Number</Label>
                <Input
                  id="userPhone"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+381 ..."
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
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
                  Save Changes
                </Button>

                <Button onClick={handleChangePassword} variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card data-tour="subscription">
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                View your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Plan</Label>
                <div>
                  <Badge
                    variant={getPlanBadgeVariant(subscription?.plan || 'FREE')}
                    className="text-lg px-4 py-2"
                  >
                    {subscription?.plan} PLAN
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Member Limit</Label>
                  <div className="text-2xl font-bold">
                    {subscription?.memberLimit}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Members</Label>
                  <div className="text-2xl font-bold">
                    {subscription?.currentMembersCount}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Usage</Label>
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
                  {subscription?.currentMembersCount} of {subscription?.memberLimit}{' '}
                  members used
                </p>
              </div>

              <Button variant="outline" disabled>
                Upgrade Plan (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <HelpButton pageKey="settings" />
    </div>
  );
}
