'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  BarChart,
  KanbanSquare,
  Video,
  Users,
  Settings,
  LogOut,
  Building2,
  UserPlus,
} from 'lucide-react';
import FullScreenLoader from '@/components/FullScreenLoader';
import { CompanyProfile, isSafeLogoUrl } from '@/lib/types/task';

const PRIMARY_NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks Board', icon: ListTodo },
  { href: '/gantt', label: 'Gantt Chart', icon: BarChart },
  { href: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
  { href: '/meetings', label: 'Meetings', icon: Video },
  { href: '/team', label: 'Team Data', icon: Users },
];

function getCompanyInitials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TW';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function SidebarNavContent({
  userRole,
  company,
  onNavigate,
  onLogoutStart,
}: {
  userRole?: string | null;
  company?: CompanyProfile | null;
  onNavigate?: () => void;
  onLogoutStart: () => void;
}) {
  const pathname = usePathname();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const brandName = company?.name?.trim() || 'Task Workspace';
  const brandSub = company?.tagline?.trim() || 'Task Workspace';
  const initials = getCompanyInitials(company?.name);
  const showLogo = isSafeLogoUrl(company?.logo_url) && failedLogoUrl !== company?.logo_url;

  return (
    <>
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand" onClick={onNavigate}>
          <span className="sidebar-brand-mark" aria-hidden={showLogo ? undefined : true}>
            {showLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={company!.logo_url!}
                alt={`${brandName} logo`}
                width={36}
                height={36}
                className="company-logo-img"
                onError={() => setFailedLogoUrl(company?.logo_url ?? null)}
              />
            ) : (
              initials
            )}
          </span>
          <div style={{ minInlineSize: 0 }}>
            <div className="sidebar-brand-name">{brandName}</div>
            <div className="sidebar-brand-sub">{brandSub}</div>
          </div>
        </Link>
      </div>

      <div className="sidebar-group">
        <div className="sidebar-section-title">Workspace</div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {(userRole === 'admin' || userRole === 'superadmin') && (
        <div className="sidebar-group">
          <div className="sidebar-section-title">Administration</div>
          <nav className="sidebar-nav" aria-label="Administration navigation">
            <Link
              href="/admin/users"
              className="nav-link"
              aria-current={pathname === '/admin/users' ? 'page' : undefined}
              onClick={onNavigate}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>Manage Users</span>
            </Link>
            {userRole === 'superadmin' && (
              <Link
                href="/superadmin/companies"
                className="nav-link"
                aria-current={pathname === '/superadmin/companies' ? 'page' : undefined}
                onClick={onNavigate}
              >
                <Building2 size={18} aria-hidden="true" />
                <span>Manage Companies</span>
              </Link>
            )}
          </nav>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-section-title">Account</div>
        <nav className="sidebar-nav" aria-label="Account navigation">
          <Link
            href="/settings"
            className="nav-link"
            aria-current={pathname === '/settings' ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              onLogoutStart();
              const { logout } = await import('@/app/login/actions');
              await logout();
            }}
            className="nav-link"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </nav>
      </div>
    </>
  );
}

export default function Sidebar({
  userRole,
  company,
}: {
  userRole?: string | null;
  company?: CompanyProfile | null;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <>
      {isLoggingOut && <FullScreenLoader message="Signing out..." />}
      <aside className="sidebar" aria-label="Sidebar">
        <SidebarNavContent
          userRole={userRole}
          company={company}
          onLogoutStart={() => setIsLoggingOut(true)}
        />
      </aside>
    </>
  );
}
