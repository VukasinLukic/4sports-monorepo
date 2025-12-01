import { useLocation, Link } from 'react-router-dom';
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
import { Bell, User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/shared/GlobalSearch';

const routeNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/members': 'Members',
  '/coaches': 'Coaches',
  '/finances': 'Finances',
  '/settings': 'Settings',
};

export const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentRouteName = routeNameMap[location.pathname] || 'Page';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{currentRouteName}</h2>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
