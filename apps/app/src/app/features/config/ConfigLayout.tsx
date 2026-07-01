import { logoutThunk, selectUser, useAppDispatch, useAppSelector } from '@org/store';
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
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  Gift,
  HardDrive,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  IndianRupee,
  Settings as SettingsIcon,
  Sparkles,
  Users,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: ReactNode;
  end?: boolean;
}

interface NavGroup {
  labelKey?: string;
  defaultLabel?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    items: [
      {
        to: '/config',
        labelKey: 'config.overview',
        defaultLabel: 'Overview',
        icon: <LayoutDashboard className="size-5" />,
        end: true,
      },
    ],
  },
  {
    labelKey: 'config.group.people',
    defaultLabel: 'People',
    items: [
      { to: '/config/users', labelKey: 'config.users', defaultLabel: 'Users', icon: <Users className="size-5" /> },
      { to: '/config/referrals', labelKey: 'config.referrals', defaultLabel: 'Referrals', icon: <Gift className="size-5" /> },
      { to: '/config/verification', labelKey: 'config.verification', defaultLabel: 'Verification', icon: <BadgeCheck className="size-5" /> },
    ],
  },
  {
    labelKey: 'config.group.billing',
    defaultLabel: 'Billing',
    items: [
      { to: '/config/plans', labelKey: 'config.plans', defaultLabel: 'Plans', icon: <CreditCard className="size-5" /> },
      { to: '/config/payments', labelKey: 'config.payments', defaultLabel: 'Payments', icon: <IndianRupee className="size-5" /> },
    ],
  },
  {
    labelKey: 'config.group.comms',
    defaultLabel: 'Comms & AI',
    items: [
      { to: '/config/notifications', labelKey: 'config.notifications', defaultLabel: 'Notifications', icon: <Bell className="size-5" /> },
      { to: '/config/mail-logs', labelKey: 'config.mailLogs', defaultLabel: 'Mail logs', icon: <Mail className="size-5" /> },
      { to: '/config/ai-usage', labelKey: 'config.aiUsage', defaultLabel: 'AI usage', icon: <Sparkles className="size-5" /> },
    ],
  },
  {
    labelKey: 'config.group.system',
    defaultLabel: 'System',
    items: [
      { to: '/config/lookups', labelKey: 'config.lookups', defaultLabel: 'Lookups', icon: <ListChecks className="size-5" /> },
      { to: '/config/queues', labelKey: 'config.queues', defaultLabel: 'Queues', icon: <Layers className="size-5" /> },
      { to: '/config/storage', labelKey: 'config.storage', defaultLabel: 'Storage', icon: <HardDrive className="size-5" /> },
      { to: '/config/settings', labelKey: 'config.settings', defaultLabel: 'Settings', icon: <SettingsIcon className="size-5" /> },
    ],
  },
];

function Brand() {
  const { collapsed } = useSidebar();
  const { t } = useTranslation();
  return (
    <Link to="/config" className="flex items-center gap-2 font-semibold text-foreground">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        A
      </span>
      {!collapsed && <span className="truncate">{t('config.brand', 'Admin')}</span>}
    </Link>
  );
}

function ConfigUser() {
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
          <Link to="/dashboard">{t('config.backToApp', 'Back to app')}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-error focus:text-error">
          <LogOut className="mr-2 size-4" />
          {t('nav.logout', 'Logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConfigNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname.startsWith(to);

  return (
    <>
      <SidebarHeader>
        <Brand />
        <SidebarCollapseButton className="ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group, i) => (
          <SidebarGroup
            key={group.labelKey ?? i}
            label={group.labelKey ? t(group.labelKey, group.defaultLabel ?? '') : undefined}
          >
            {group.items.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={t(item.labelKey, item.defaultLabel)}
                active={isActive(item.to, item.end)}
              >
                <NavLink to={item.to} end={item.end} />
              </SidebarItem>
            ))}
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="space-y-1">
        <SidebarItem
          icon={<ArrowLeft className="size-5" />}
          label={t('config.backToApp', 'Back to app')}
        >
          <NavLink to="/dashboard" />
        </SidebarItem>
        <ConfigUser />
      </SidebarFooter>
    </>
  );
}

/**
 * Standalone admin dashboard shell (collapsible sidebar) at /config/*.
 * Each child route hosts one generic module's admin UI.
 */
export function ConfigLayout() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('config.denied.title', 'Access denied')}
          </h2>
          <p className="mt-2 text-foreground/60">
            {t('config.denied.body', 'You need admin privileges to view this page.')}
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t('config.backToApp', 'Back to app')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <ConfigNav />
        </Sidebar>
        <SidebarMobile>
          <ConfigNav />
        </SidebarMobile>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
            <SidebarTrigger />
            <span className="text-sm font-medium text-foreground/70">
              {t('config.title', 'Admin console')}
            </span>
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

export default ConfigLayout;
