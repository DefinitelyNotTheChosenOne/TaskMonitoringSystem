'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageAnimator from '@/components/PageAnimator';
import PageHeader from '@/components/PageHeader';
import CommandPalette from '@/components/CommandPalette';
import NotificationCenter from '@/components/NotificationCenter';
import ThemeQuickToggle from '@/components/ThemeQuickToggle';
import { MONTHS, YEARS, useWorkspacePeriod } from '@/components/WorkspacePeriodProvider';
import { CompanyProfile } from '@/lib/types/task';

function getRoleBadgeMeta(role?: string | null): { label: string; badgeClass: string } {
  switch (role?.toLowerCase()) {
    case 'superadmin':
      return { label: 'Superadmin', badgeClass: 'badge--accent' };
    case 'admin':
      return { label: 'Admin', badgeClass: 'badge--info' };
    default:
      return { label: 'Employee', badgeClass: 'badge--neutral' };
  }
}

export default function AppShell({
  children,
  userRole,
  userName,
  company,
}: {
  children: React.ReactNode;
  userRole?: string | null;
  userName?: string | null;
  company?: CompanyProfile | null;
}) {
  const pathname = usePathname();
  const { month, year, setMonth, setYear } = useWorkspacePeriod();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const displayName = userName?.trim() || 'Team Member';
  const roleMeta = getRoleBadgeMeta(userRole);

  return (
      <div className="app-layout">
        <Sidebar userRole={userRole} company={company} />

        <main className="main-content">
          <header className="top-bar">
            <div className="top-bar-start">
              <div className="top-bar-welcome">
                <span className="top-bar-welcome-text">
                  Welcome, <strong>{displayName}</strong>
                </span>
                <span className={`badge ${roleMeta.badgeClass}`}>{roleMeta.label}</span>
              </div>
            </div>

            <div className="top-bar-center">
              <PageHeader />
            </div>

            <div className="top-bar-actions" aria-label="Workspace tools and reporting period">
              <CommandPalette userRole={userRole} />
              <ThemeQuickToggle />
              <NotificationCenter />
              <select
                aria-label="Select reporting month"
                className="field-select field-select--compact"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                aria-label="Select reporting year"
                className="field-select field-select--compact"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <div className="page-content">
            <PageAnimator>{children}</PageAnimator>
          </div>
        </main>
      </div>
  );
}
