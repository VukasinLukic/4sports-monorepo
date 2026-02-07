import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">{t('notFound.title')}</h1>
        <p className="text-2xl text-muted-foreground mb-8">{t('notFound.message')}</p>
        <Link to="/">
          <Button>{t('notFound.goToDashboard')}</Button>
        </Link>
      </div>
    </div>
  );
};
