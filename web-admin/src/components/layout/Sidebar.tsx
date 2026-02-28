import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { useConversations } from '@/features/chat/useChat';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  CalendarDays,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  nameKey: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { nameKey: 'navigation.dashboard', path: '/', icon: LayoutDashboard },
  { nameKey: 'navigation.finances', path: '/finances', icon: DollarSign },
  { nameKey: 'navigation.clubMembers', path: '/club-members', icon: Users },
  { nameKey: 'navigation.evidence', path: '/evidence', icon: ClipboardList },
  { nameKey: 'navigation.news', path: '/news', icon: Newspaper },
  { nameKey: 'navigation.calendar', path: '/calendar', icon: CalendarDays },
  { nameKey: 'navigation.chat', path: '/chat', icon: MessageCircle },
  { nameKey: 'navigation.settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { logout, user, backendUser } = useAuth();
  const { conversations } = useConversations();

  const totalUnread = conversations.reduce((sum, conv) => {
    if (!backendUser) return sum;
    return sum + (conv.unreadCounts?.[backendUser._id] ?? 0);
  }, 0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
          'md:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!collapsed && (
              <h1 className="text-2xl font-bold text-primary">4Sports</h1>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-accent transition-colors ml-auto"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const name = t(item.nameKey);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? name : undefined}
                >
                  <div className="relative shrink-0">
                    <Icon size={20} />
                    {item.path === '/chat' && totalUnread > 0 && collapsed && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="font-medium">{name}</span>}
                  {!collapsed && item.path === '/chat' && totalUnread > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-2 border-t border-border space-y-2">
            {!collapsed && user && (
              <div className="px-3 py-2 text-sm text-muted-foreground truncate">
                {user.email}
              </div>
            )}
            <Button
              onClick={() => {
                handleLogout();
                handleNavClick();
              }}
              variant="ghost"
              className={cn(
                'w-full justify-start',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? t('auth.logout') : undefined}
            >
              <LogOut size={20} />
              {!collapsed && <span className="ml-3">{t('auth.logout')}</span>}
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};
