import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { useConversations } from '@/features/chat/useChat';
import { useClubSettings } from '@/features/settings/useSettings';
import { useOnboarding, PAGE_TUTORIALS } from '@/context/OnboardingContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  Newspaper,
  CalendarDays,
  MessageCircle,
  ClipboardList,
  HelpCircle,
  Building2,
  PlayCircle,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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

const pathToPageKey: Record<string, string> = {
  '/': 'dashboard',
  '/club-members': 'members',
  '/coaches': 'coaches',
  '/finances': 'finances',
  '/settings': 'settings',
};

export const Sidebar = ({ collapsed, mobileOpen, onClose, onMouseEnter, onMouseLeave }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { backendUser } = useAuth();
  const { conversations } = useConversations();
  const { data: clubSettings } = useClubSettings();
  const { startTutorial, resetTutorial } = useOnboarding();
  const [helpOpen, setHelpOpen] = useState(false);

  const totalUnread = conversations.reduce((sum, conv) => {
    if (!backendUser) return sum;
    return sum + (conv.unreadCounts?.[backendUser._id] ?? 0);
  }, 0);

  const currentPageKey = pathToPageKey[location.pathname] || '';
  const currentTutorial = currentPageKey ? PAGE_TUTORIALS[currentPageKey] : null;

  const handleNavClick = () => {
    onClose();
  };

  const handleRestartTutorial = () => {
    if (currentPageKey) {
      resetTutorial(currentPageKey);
      startTutorial(currentPageKey);
    }
    setHelpOpen(false);
  };

  const handleVideoTutorial = () => {
    setHelpOpen(false);
    navigate('/video-tutorial');
  };

  const handleClubProfile = () => {
    handleNavClick();
    navigate('/club-profile');
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn(
            'flex items-center border-b border-border',
            collapsed ? 'justify-center p-2' : 'justify-between p-4'
          )}>
            <a
              href="https://4sports.rs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 min-w-0"
            >
              <img
                src="/logo.png"
                alt="4Sports"
                className="w-8 h-8 object-contain shrink-0"
              />
              {!collapsed && (
                <h1 className="text-xl font-bold text-primary truncate">4Sports</h1>
              )}
            </a>
          </div>

          {/* Navigation */}
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

          {/* Bottom section */}
          <div className="p-2 border-t border-border space-y-1">
            {/* Pomoć */}
            <Popover open={helpOpen} onOpenChange={setHelpOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? t('sidebar.help') : undefined}
                >
                  <HelpCircle size={20} className="shrink-0" />
                  {!collapsed && <span className="font-medium">{t('sidebar.help')}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-56 p-2 space-y-1">
                <button
                  onClick={handleRestartTutorial}
                  disabled={!currentTutorial}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    currentTutorial
                      ? 'hover:bg-accent hover:text-accent-foreground'
                      : 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <PlayCircle size={16} />
                  {t('sidebar.restartGuide')}
                </button>
                <button
                  onClick={handleVideoTutorial}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Video size={16} />
                  {t('sidebar.videoTutorial')}
                </button>
              </PopoverContent>
            </Popover>

            {/* Profil kluba */}
            <button
              onClick={handleClubProfile}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full',
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? (clubSettings?.clubName || t('sidebar.clubProfile')) : undefined}
            >
              <Building2 size={20} className="shrink-0" />
              {!collapsed && (
                <span className="font-medium truncate">
                  {clubSettings?.clubName || t('sidebar.clubProfile')}
                </span>
              )}
            </button>
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
