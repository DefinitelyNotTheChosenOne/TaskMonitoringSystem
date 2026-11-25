'use client';

import { usePathname } from 'next/navigation';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Workspace overview & team performance metrics',
  },
  '/tasks': {
    title: 'Tasks Board',
    subtitle: 'Track assignments, priorities, and deadlines',
  },
  '/gantt': {
    title: 'Timeline Gantt',
    subtitle: 'Schedule durations and task progress',
  },
  '/kanban': {
    title: 'Kanban Board',
    subtitle: 'Visual workflow across execution stages',
  },
  '/meetings': {
    title: 'Meeting Archive',
    subtitle: 'Agendas, minutes, and tracked action items',
  },
  '/team': {
    title: 'Team Directory',
    subtitle: 'Employee roster and department structure',
  },
  '/admin/users': {
    title: 'Manage Users',
    subtitle: 'Provision and administer employee accounts',
  },
  '/superadmin/companies': {
    title: 'Manage Companies',
    subtitle: 'Multi-tenant company onboarding',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Profile, notifications, and theme preferences',
  },
};

export default function PageHeader() {
  const pathname = usePathname();
  const meta = ROUTE_TITLES[pathname] ?? {
    title: 'Task Management System',
    subtitle: 'JRPCo Prime Workspace',
  };

  return (
    <div className="top-bar-title-group">
      <h1>{meta.title}</h1>
      <span className="top-bar-subtitle">{meta.subtitle}</span>
    </div>
  );
}
