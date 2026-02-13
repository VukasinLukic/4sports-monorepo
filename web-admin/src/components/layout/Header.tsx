import { useLocation, Link, useNavigate } from 'react-router-dom';
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
import { Bell, User, LogOut, Menu, Sun, Moon, Check } from 'lucide-react';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useTheme } from '@/context/ThemeContext';
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/features/notifications/useNotifications';

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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifications = [] } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllMutation = useMarkAllAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllMutation.mutate();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type and data
    if (notification.data?.postId) {
      navigate(`/news`, { state: { focusPostId: notification.data.postId, openComments: true, focusCommentId: notification.data.commentId } });
    } else if (notification.data?.eventId) {
      navigate(`/calendar/${notification.data.eventId}`);
    } else if (notification.data?.memberId) {
      navigate(`/profile/member/${notification.data.memberId}`);
    } else if (notification.data?.paymentId) {
      navigate('/finances');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'upravo sada';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('sr-RS');
  };

  const routeKey = routeKeyMap[location.pathname];
  const currentRouteName = routeKey
    ? t(routeKey)
    : location.pathname.startsWith('/calendar/') ? t('calendar.title')
    : location.pathname.startsWith('/profile/') ? t('profile.title')
    : t('common.page');

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative hidden sm:flex">
                <Button variant="ghost" size="icon">
                  <Bell size={20} />
                </Button>
                {unreadCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      zIndex: 20,
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[350px] max-h-96 overflow-y-auto"
            >
              <style>{`
                [role="menu"]::-webkit-scrollbar {
                  width: 5px;
                }
                [role="menu"]::-webkit-scrollbar-track {
                  background-color: transparent;
                }
                [role="menu"]::-webkit-scrollbar-thumb {
                  background-color: rgb(34, 197, 94);
                  border-radius: 4px;
                }
                [role="menu"]::-webkit-scrollbar-thumb:hover {
                  background-color: rgb(22, 163, 74);
                }
              `}</style>
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel>
                  {t('notifications.title')} {unreadCount > 0 && <span className="text-green-600 font-bold">({unreadCount})</span>}
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    className="h-auto py-0 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleMarkAllRead}
                    disabled={markAllMutation.isPending}
                  >
                    <Check size={14} className="mr-1" />
                    Označi sve
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications && notifications.length > 0 ? (
                <div className="space-y-1 p-1">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-2 py-2 cursor-pointer rounded-sm text-sm transition-colors font-medium ${
                        !notification.isRead
                          ? 'bg-green-100 dark:bg-green-950/50 border-l-4 border-green-500'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('notifications.noNew')}
                </div>
              )}
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
