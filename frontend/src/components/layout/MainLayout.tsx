import clsx from 'clsx';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Box,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  LineChart,
  LifeBuoy,
  LogOut,
  Menu,
  Network,
  PanelsTopLeft,
  Package,
  Receipt,
  ServerCog,
  Settings,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Store,
  TruckIcon,
  Users,
  X,
  FolderOpen,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect, useMemo, useState } from 'react';
import CurrencyWidget from '@/components/CurrencyWidget';
import FullscreenToggle from '@/components/FullscreenToggle';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useAuthStore } from '@/store/authStore';
import { OffCanvas } from '@/components/ui/OffCanvas';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, tenantName, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [commandPanelOpen, setCommandPanelOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(now),
    [now]
  );

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigationSections = [
    {
      title: 'Executive',
      items: [
        { name: 'Global Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics Studio', href: '/reports-analytics', icon: LineChart },
        { name: 'Reports Hub', href: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Commerce',
      items: [
        { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
        { name: 'Invoices', href: '/invoices', icon: Receipt },
        { name: 'Purchase Orders', href: '/purchase-orders', icon: TruckIcon },
      ],
    },
    {
      title: 'Catalog & Stock',
      items: [
        { name: 'Categories', href: '/categories', icon: FolderOpen },
        { name: 'Products', href: '/products', icon: Box },
        { name: 'Inventory', href: '/inventory', icon: Package },
      ],
    },
    {
      title: 'Relationships',
      items: [
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Vendors', href: '/vendors', icon: Store },
      ],
    },
    {
      title: 'Platform & Control',
      items: [
        { name: 'Role Center', href: '/roles-permissions', icon: Shield },
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Tenant Ops', href: '/tenant-ops', icon: Network },
        { name: 'Sync Center', href: '/sync-center', icon: ServerCog },
      ],
    },
  ];

  const flattenedNavigation = navigationSections.flatMap((section) => section.items);
  const currentPath = location.pathname;

  const renderNavItem = (item: (typeof flattenedNavigation)[number]) => {
    const Icon = item.icon;
    const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.name}
        to={item.href}
        className={clsx(
          'group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all',
          isCollapsed ? 'justify-center' : 'justify-start',
          isActive
            ? 'bg-blue-600/10 text-blue-600 shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <Icon
          className={clsx(
            'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105',
            isActive && 'text-blue-600'
          )}
        />
        {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
        {isActive && !isCollapsed && (
          <span className="absolute inset-y-1 left-1 w-[3px] rounded-full bg-blue-500" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar for desktop */}
      <aside
        className={clsx(
          'hidden md:fixed md:inset-y-0 md:flex md:flex-col border-r border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-lg transition-all duration-300',
          isCollapsed ? 'md:w-20' : 'md:w-72'
        )}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-6 w-6 text-blue-600" />
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Genzi RMS</h1>
                  <p className="text-xs text-slate-400">Unified Commerce</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Toggle sidebar width"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isCollapsed && (
            <div className="px-4 py-3">
              <CurrencyWidget />
            </div>
          )}

          <div className="px-4 py-3 border-y border-slate-200 bg-white/70 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              {!isCollapsed ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tenant</p>
                  <p className="text-sm font-medium text-slate-900">{tenantName ?? tenant ?? '—'}</p>
                </div>
              ) : (
                <Shield className="h-5 w-5 text-slate-400" />
              )}
              {!isCollapsed && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Local time</p>
                  <p className="text-xs font-medium text-slate-600">{formattedDate}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {section.title}
                    </p>
                    <span className="text-[11px] text-slate-300">{section.items.length}</span>
                  </div>
                )}
                <div className="mt-2 space-y-1">{section.items.map(renderNavItem)}</div>
              </div>
            ))}
          </nav>

          <div className="flex-shrink-0 border-t border-slate-200 p-4">
            <button
              onClick={() => setCommandPanelOpen(true)}
              className={clsx(
                'mb-3 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600',
                isCollapsed && 'justify-center'
              )}
            >
              <Command className="h-4 w-4" />
              {!isCollapsed && <span>Command center</span>}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-400">{user?.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={clsx(
                'mt-3 flex w-full items-center gap-2 rounded-xl border border-transparent bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h1 className="text-xl font-semibold text-slate-900">Genzi RMS</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full border border-slate-200 p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tenant</p>
              <p className="text-sm font-medium text-slate-900">{tenantName ?? tenant ?? '—'}</p>
              <p className="mt-1 text-xs text-slate-400">{formattedDate}</p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {section.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={clsx(
                            'flex items-center rounded-xl px-3 py-2 text-sm font-medium transition',
                            isActive
                              ? 'bg-blue-600/10 text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                          )}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex-shrink-0 border-t border-slate-200 p-4">
              <button
                onClick={() => {
                  setCommandPanelOpen(true);
                  setSidebarOpen(false);
                }}
                className="mb-3 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <Command className="h-4 w-4" />
                Command center
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs capitalize text-slate-400">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-transparent bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={clsx(
          'flex flex-1 flex-col transition-all duration-300',
          isCollapsed ? 'md:pl-20' : 'md:pl-72'
        )}
      >
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center border-b border-slate-200 bg-white md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-slate-900">Genzi RMS</h1>
            <FullscreenToggle />
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="sticky top-0 z-10 hidden border-b border-slate-200 bg-white/80 backdrop-blur md:block">
          <div className="flex items-center justify-end gap-3 px-6 py-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <span>{formattedDate}</span>
            </div>
            <NotificationDropdown />
            <FullscreenToggle />
          </div>
        </div>

        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      <OffCanvas
        isOpen={commandPanelOpen}
        onClose={() => setCommandPanelOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Command Center</p>
              <p className="text-xs text-slate-500">Accelerate navigation & quick actions</p>
            </div>
          </div>
        }
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jump to</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {flattenedNavigation.map((item) => (
                <button
                  key={`command-${item.href}`}
                  onClick={() => {
                    navigate(item.href);
                    setCommandPanelOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <item.icon className="h-4 w-4 text-blue-500" />
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Operational shortcuts
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-800">Create purchase order</p>
                  <p className="text-xs text-slate-500">Launch replenishment workflow</p>
                </div>
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-800">Schedule executive brief</p>
                  <p className="text-xs text-slate-500">Automate daily KPI snapshots</p>
                </div>
                <Activity className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Support & resources</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                <LifeBuoy className="h-4 w-4 text-blue-500" />
                View knowledge hub
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                <FileText className="h-4 w-4 text-blue-500" />
                Download audit trail
              </button>
            </div>
          </div>
        </div>
      </OffCanvas>
    </div>
  );
}

export default MainLayout;
