import { cn } from '@org/utils';
import { PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Sheet, SheetContent } from './sheet';
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from './tooltip';

const STORAGE_KEY = 'sidebar:collapsed';

type SidebarContextValue = {
  /** Desktop rail collapsed to icons-only. */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  /** Mobile drawer open state. */
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}

function readStoredCollapsed(fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === null ? fallback : raw === 'true';
}

export interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState(() =>
    readStoredCollapsed(defaultCollapsed),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(v));
    }
  }, []);

  const toggleCollapsed = useCallback(
    () => setCollapsed(!collapsed),
    [collapsed, setCollapsed],
  );

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, setCollapsed, toggleCollapsed, mobileOpen],
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

/**
 * Desktop rail. Hidden below `lg`; animates between full width and an
 * icons-only rail. Compose with SidebarHeader/Content/Footer/Group/Item.
 */
export function Sidebar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { collapsed } = useSidebar();
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'hidden lg:flex shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[4.5rem]' : 'w-64',
        className,
      )}
    >
      {children}
    </aside>
  );
}

/**
 * Mobile drawer. Renders the same nav inside a left Sheet controlled by the
 * provider's `mobileOpen`. Labels always show here (never collapsed). Tapping a
 * link closes the drawer.
 */
export function SidebarMobile({ children }: { children: ReactNode }) {
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useSidebar();
  // Force labels visible inside the drawer regardless of desktop collapse.
  const drawerValue = useMemo(
    () => ({
      collapsed: false,
      setCollapsed,
      toggleCollapsed: () => setCollapsed(!collapsed),
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, setCollapsed, mobileOpen, setMobileOpen],
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
        <SidebarContext.Provider value={drawerValue}>
          <div
            className="flex h-full flex-col"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setMobileOpen(false);
            }}
          >
            {children}
          </div>
        </SidebarContext.Provider>
      </SheetContent>
    </Sheet>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-2 border-b border-border/60 px-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-2 py-3', className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-border/60 p-2', className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const { collapsed } = useSidebar();
  return (
    <div className={cn('py-1', className)}>
      {label && !collapsed && (
        <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground/40">
          {label}
        </p>
      )}
      {label && collapsed && <div className="mx-2 my-2 border-t border-border/60" />}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export interface SidebarItemProps {
  /** Leading icon (e.g. a lucide icon element). */
  icon?: ReactNode;
  /** Text label; hidden when the rail is collapsed. */
  label: ReactNode;
  active?: boolean;
  /** Tooltip shown when collapsed. Defaults to `label`. */
  tooltip?: ReactNode;
  /**
   * A single element (e.g. a router `<NavLink to="…" />`) into which the icon
   * and label are injected. When omitted a plain button is rendered.
   */
  children?: ReactElement<{ className?: string; onClick?: () => void }>;
  onClick?: () => void;
  className?: string;
}

export function SidebarItem({
  icon,
  label,
  active,
  tooltip,
  children,
  onClick,
  className,
}: SidebarItemProps) {
  const { collapsed } = useSidebar();

  const classes = cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50',
    active
      ? 'bg-primary/10 text-primary'
      : 'text-foreground/70 hover:bg-secondary/60 hover:text-foreground',
    collapsed && 'justify-center px-0',
    className,
  );

  const inner = (
    <>
      {icon && <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>}
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  );

  const el = isValidElement(children) ? (
    cloneElement(
      children,
      { className: cn(classes, children.props.className), onClick },
      inner,
    )
  ) : (
    <button type="button" className={classes} onClick={onClick}>
      {inner}
    </button>
  );

  if (collapsed) {
    return (
      <TooltipRoot>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="right">{tooltip ?? label}</TooltipContent>
      </TooltipRoot>
    );
  }
  return el;
}

/** Desktop-only collapse toggle (chevron/panel icon). */
export function SidebarCollapseButton({ className }: { className?: string }) {
  const { collapsed, toggleCollapsed } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'hidden lg:inline-flex items-center justify-center rounded-md p-2 text-foreground/60 transition-colors hover:bg-secondary/60 hover:text-foreground',
        className,
      )}
    >
      {collapsed ? (
        <PanelLeftOpen className="size-5" />
      ) : (
        <PanelLeftClose className="size-5" />
      )}
    </button>
  );
}

/** Mobile-only hamburger that opens the drawer. */
export function SidebarTrigger({ className }: { className?: string }) {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open menu"
      className={cn(
        'inline-flex lg:hidden items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground',
        className,
      )}
    >
      <Menu className="size-5" />
    </button>
  );
}
