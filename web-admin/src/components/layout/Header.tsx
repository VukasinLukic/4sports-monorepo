import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/shared/GlobalSearch';

const routeKeyMap: Record<string, string> = {
  '/': 'navigation.dashboard',
  '/club-members': 'navigation.clubMembers',
  '/invites': 'navigation.inviteCodes',
  '/news': 'navigation.news',
  '/calendar': 'navigation.calendar',
  '/chat': 'navigation.chat',
  '/evidence': 'navigation.evidence',
  '/finances': 'navigation.finances',
  '/settings': 'navigation.settings',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const routeKey = routeKeyMap[location.pathname];
  const currentRouteName = routeKey
    ? t(routeKey)
    : (location.pathname.startsWith('/calendar/') ? t('calendar.title') : t('common.page'));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </Button>
          <h2 className="text-lg md:text-xl font-semibold">{currentRouteName}</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                <Bell size={20} />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  0
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="py-4 text-center text-sm text-muted-foreground">
                {t('notifications.noNew')}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{t('auth.myAccount')}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">{t('navigation.settings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut size={16} className="mr-2" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
