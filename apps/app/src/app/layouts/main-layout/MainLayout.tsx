import {
  logoutThunk,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarCollapseButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMobile,
  SidebarProvider,
  SidebarTrigger,
  ThemeSwitcher,
  UserAvatar,
  useSidebar,
} from '@org/ui';
import {
  ChevronsUpDown,
  Gift,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

/** Brand block; hides the wordmark when the rail is collapsed. */
function Brand() {
  const { collapsed } = useSidebar();
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2 font-semibold text-foreground"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        A
      </span>
      {!collapsed && <span className="truncate">@org/app</span>}
    </Link>
  );
}

/** Footer user menu (avatar + dropdown). Collapses to avatar-only. */
function SidebarUser() {
  const { collapsed } = useSidebar();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <UserAvatar name={user?.name} src={user?.picture} size="sm" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {user?.name}
                </span>
                <span className="block truncate text-xs text-foreground/50">
                  {user?.email}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-foreground/40" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">{t('nav.settings', 'Settings')}</Link>
        </DropdownMenuItem>
        {user?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/config">{t('nav.admin', 'Admin')}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-error focus:text-error"
        >
          <LogOut className="mr-2 size-4" />
          {t('nav.logout', 'Logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Shared nav markup rendered in both the desktop rail and mobile drawer. */
function SidebarNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useAppSelector(selectUser);

  const isActive = (to: string) =>
    to === '/dashboard' ? pathname === to : pathname.startsWith(to);

  const items: NavItem[] = [
    {
      to: '/dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      icon: <LayoutDashboard className="size-5" />,
    },
    {
      to: '/referrals',
      label: t('nav.referrals', 'Referrals'),
      icon: <Gift className="size-5" />,
    },
    {
      to: '/settings',
      label: t('nav.settings', 'Settings'),
      icon: <SettingsIcon className="size-5" />,
    },
  ];

  return (
    <>
      <SidebarHeader>
        <Brand />
        <SidebarCollapseButton className="ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {items.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              active={isActive(item.to)}
            >
              <NavLink to={item.to} />
            </SidebarItem>
          ))}
        </SidebarGroup>

        {user?.role === 'admin' && (
          <SidebarGroup label={t('nav.admin', 'Admin')}>
            <SidebarItem
              icon={<ShieldCheck className="size-5" />}
              label={t('nav.adminConsole', 'Admin console')}
              active={pathname.startsWith('/config')}
            >
              <NavLink to="/config" />
            </SidebarItem>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </>
  );
}

export function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarNav />
        </Sidebar>
        <SidebarMobile>
          <SidebarNav />
        </SidebarMobile>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeSwitcher />
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default MainLayout;
