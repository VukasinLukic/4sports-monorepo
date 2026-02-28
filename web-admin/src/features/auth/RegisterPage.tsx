import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Globe, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/locales/i18n';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const RegisterPage = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    clubName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(formData.email)) {
      setError(t('validation.invalidEmail'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('validation.passwordMin'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('validation.passwordsNoMatch'));
      return;
    }

    if (!formData.fullName.trim()) {
      setError(t('validation.fullNameRequired'));
      return;
    }

    setLoading(true);

    try {
      const firebaseUser = await register(formData.email, formData.password);
      const firebaseToken = await firebaseUser.getIdToken();

      await api.post('/auth/register', {
        firebaseToken,
        email: formData.email,
        fullName: formData.fullName,
        role: 'OWNER',
        phoneNumber: formData.phoneNumber || undefined,
        clubName: formData.clubName || formData.fullName + "'s Club",
      });

      // Force full page reload so onAuthStateChanged re-fetches the backend user
      // (navigate('/') would keep stale backendUser=null from the race condition)
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground cursor-pointer hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{SUPPORTED_LANGUAGES[i18n.language as keyof typeof SUPPORTED_LANGUAGES]?.flag} {SUPPORTED_LANGUAGES[i18n.language as keyof typeof SUPPORTED_LANGUAGES]?.nativeName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                className="cursor-pointer"
              >
                {lang.flag} {lang.nativeName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="4Sports" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-primary">4Sports</CardTitle>
          <CardDescription className="text-center">
            {t('auth.createAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="club@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('auth.phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+381 60 123 4567"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubName">{t('auth.clubName')}</Label>
              <Input
                id="clubName"
                type="text"
                placeholder="My Sports Club"
                value={formData.clubName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.signUp')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
