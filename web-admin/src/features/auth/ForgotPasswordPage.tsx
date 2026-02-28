import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { sendPasswordReset } from '@/services/auth';
import api from '@/services/api';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError(t('validation.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await api.get('/auth/check-email', { params: { email: normalizedEmail } });
      if (!data.data.exists) {
        setError(t('validation.emailNotRegistered'));
        return;
      }
      await sendPasswordReset(normalizedEmail);
      setSent(true);
    } catch {
      setError(t('errors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-4">
            {sent ? (
              <MailCheck className="h-16 w-16 text-primary" />
            ) : (
              <KeyRound className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.resetPassword')}
          </CardTitle>
          {sent ? (
            <CardDescription className="text-center text-primary font-semibold text-base">
              {t('auth.resetEmailSent')}
            </CardDescription>
          ) : (
            <CardDescription className="text-center">
              {t('auth.resetPasswordDesc')}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.resetEmailSentDesc').replace('{{email}}', email)}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="club@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '...' : t('auth.sendResetLink')}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            <Link to="/login" className="text-primary hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
