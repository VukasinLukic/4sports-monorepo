import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { FileBarChart, ArrowLeftRight, Users, CalendarDays, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickLinkItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const QuickLinks = () => {
  const { t } = useTranslation();

  const links: QuickLinkItem[] = [
    { to: '/finances', icon: FileBarChart, label: t('dashboard.reports') },
    { to: '/finances', icon: ArrowLeftRight, label: t('dashboard.transactions') },
    { to: '/members', icon: Users, label: t('navigation.members') },
    { to: '/calendar', icon: CalendarDays, label: t('navigation.calendar') },
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border',
                  'hover:bg-accent hover:border-primary/30 transition-colors',
                  'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
