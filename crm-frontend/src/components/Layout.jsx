import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  CheckSquare,
  ShieldCheck,
  Workflow,
  LogOut,
  Plus,
  Menu,
  X,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { signOut, currentUserEmail } from '../lib/session.js';
import { api, usingMockData } from '../api/index.js';
import { cn } from '../lib/utils.js';

const NAV = [
  { to: '/', label: 'Today', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { to: '/workflows', label: 'Workflows', icon: Workflow },
];

export default function Layout() {
  const navigate = useNavigate();
  const email = currentUserEmail();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    api.logout().catch(() => {});
    signOut();
    navigate('/signin', { replace: true });
  }

  const userInitial = (email ? email.charAt(0) : 'A').toUpperCase();

  return (
    <div className="min-h-screen flex bg-zinc-50/40 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white focus:rounded-md"
        href="#main"
      >
        Skip to content
      </a>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-200/80 bg-white dark:bg-zinc-900 dark:border-zinc-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-100 dark:border-zinc-800/80">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                Advisory CRM
              </p>
              <p className="text-xs text-zinc-400 font-normal mt-0.5">Lifecycle & Compliance</p>
            </div>
          </Link>
          <button
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action button */}
        <div className="px-4 pt-4 pb-2">
          <Link
            to="/contacts/new"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-2xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Contact</span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <p className="px-2.5 pb-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Menu
          </p>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & User */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          {usingMockData && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 text-[11px] font-medium">
              <Database className="w-3 h-3 shrink-0" />
              <span>Sample data mode</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                {userInitial}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {email || 'Advisor'}
                </p>
                <p className="text-[10px] text-zinc-400">Advisor Workspace</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header className="flex items-center justify-between h-14 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 rounded-md"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Advisory CRM</span>
          </div>
          <Link
            to="/contacts/new"
            className="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-md bg-zinc-900 text-white"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </Link>
        </header>

        <main id="main" className="flex-1 px-4 sm:px-6 lg:px-8 py-7 max-w-7xl w-full mx-auto" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
