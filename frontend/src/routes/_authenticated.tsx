import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth.store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  FLEET_DRIVER: 'Fleet Driver',
  SERVICE_SHOP_REPRESENTATIVE: 'Service Shop Rep',
  STANDARD_USER: 'Standard User',
};

function FleetMasterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="3" height="3" rx="0.5" fill="white" />
          <rect x="7" y="2" width="3" height="3" rx="0.5" fill="white" />
          <rect x="12" y="2" width="6" height="3" rx="0.5" fill="white" />
          <rect x="2" y="7" width="6" height="3" rx="0.5" fill="white" />
          <rect x="11" y="7" width="3" height="3" rx="0.5" fill="white" />
          <rect x="2" y="12" width="3" height="6" rx="0.5" fill="white" />
          <rect x="7" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="12" y="15" width="6" height="3" rx="0.5" fill="white" />
        </svg>
      </div>
      <div>
        <div className="font-[Manrope] font-extrabold text-sm leading-tight text-neutral-dark">
          FLEET MASTER
        </div>
        <div className="font-[Inter] text-[10px] text-slate-400 tracking-widest leading-tight">
          PRECISION CONTROL
        </div>
      </div>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FleetIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3h4l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2h-4"
      />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function TopBarGearIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function AuthenticatedLayout() {
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const initials = email
    ? email
        .split('@')[0]
        .split(/[._-]/)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('')
    : 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 bg-white flex flex-col border-r border-slate-100"
        style={{ boxShadow: '2px 0 8px 0 rgba(0,0,0,0.04)' }}
      >
        {/* Logo area */}
        <div className="px-4 py-5 border-b border-slate-100">
          <FleetMasterLogo />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Main Menu
          </p>

          <NavItem to="/dashboard" label="Dashboard">
            <DashboardIcon />
          </NavItem>

          <NavItem to="/vehicles" label="Fleet Details">
            <FleetIcon />
          </NavItem>

          <DisabledNavItem label="Service">
            <ServiceIcon />
          </DisabledNavItem>

          <DisabledNavItem label="Analytics">
            <AnalyticsIcon />
          </DisabledNavItem>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-2">
          {/* Generate Report button */}
          <button className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Generate Report
          </button>

          {/* Settings row */}
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer">
            <SettingsIcon />
            <span>Settings</span>
          </button>

          {/* Support row */}
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer">
            <SupportIcon />
            <span>Support</span>
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-colors cursor-pointer mt-1"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Right panel: TopBar + scrollable content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar */}
        <header
          className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4 shrink-0"
          style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
        >
          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search vehicles, drivers..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-[#F1F5F9] border border-transparent rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bell */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer">
            <BellIcon />
            <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary rounded-full" />
          </button>

          {/* Gear */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer">
            <TopBarGearIcon />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200" />

          {/* Avatar + info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-neutral-dark leading-tight">
                {email ?? 'User'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {role ? (roleLabelMap[role] ?? role) : 'Member'}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      activeProps={{
        className:
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-light text-primary',
      }}
      inactiveProps={{
        className:
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800',
      }}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

function DisabledNavItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed select-none">
      {children}
      <span>{label}</span>
      <span className="ml-auto text-[9px] font-semibold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
        Soon
      </span>
    </div>
  );
}
