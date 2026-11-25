'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Compass, ListTodo, Search, Users } from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import { listTasks } from '@/lib/api/tasks';
import { listMeetings } from '@/lib/api/meetings';
import { getTeamMembers } from '@/lib/api/team';

interface CommandPaletteEntry {
  id: string;
  group: 'Pages' | 'Tasks' | 'Meetings' | 'Team';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

const STATIC_PAGES: CommandPaletteEntry[] = [
  { id: 'page-home', group: 'Pages', title: 'Executive Dashboard', subtitle: 'KPIs & analytics overview', href: '/' },
  { id: 'page-tasks', group: 'Pages', title: 'Tasks Board', subtitle: 'Full task data grid, checklists & Excel', href: '/tasks' },
  { id: 'page-kanban', group: 'Pages', title: 'Kanban Board', subtitle: 'Drag-and-drop workflow lanes', href: '/kanban' },
  { id: 'page-gantt', group: 'Pages', title: 'Timeline & Gantt', subtitle: 'Schedules & milestone tracker', href: '/gantt' },
  { id: 'page-meetings', group: 'Pages', title: 'Meetings & Action Items', subtitle: 'Minutes & action conversion', href: '/meetings' },
  { id: 'page-team', group: 'Pages', title: 'Team Data Sheet', subtitle: 'Workload & employee directory', href: '/team' },
  { id: 'page-settings', group: 'Pages', title: 'Workspace Settings', subtitle: 'Profile, theme, density & taxonomy', href: '/settings' },
];

export default function CommandPalette({ userRole }: { userRole?: string | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [entries, setEntries] = useState<CommandPaletteEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const loadWorkspaceIndex = useCallback(async () => {
    setLoading(true);
    const [tasksRes, meetingsRes, employees] = await Promise.all([
      listTasks(),
      listMeetings(),
      getTeamMembers(),
    ]);

    const nextEntries: CommandPaletteEntry[] = [];

    for (const t of (tasksRes.tasks ?? []).slice(0, 25)) {
      nextEntries.push({
        id: `task-${t.id}`,
        group: 'Tasks',
        title: t.title,
        subtitle: `${t.task_code} · ${t.assignee_name}`,
        href: '/tasks',
        badge: t.status,
      });
    }

    for (const m of (meetingsRes.meetings ?? []).slice(0, 15)) {
      nextEntries.push({
        id: `mtg-${m.id}`,
        group: 'Meetings',
        title: m.title,
        subtitle: `${m.meeting_no} · ${m.meeting_date || 'Scheduled'}`,
        href: '/meetings',
        badge: `${m.action_items.length} actions`,
      });
    }

    for (const emp of (employees ?? []).slice(0, 25)) {
      nextEntries.push({
        id: `emp-${emp.id}`,
        group: 'Team',
        title: String(emp.name ?? 'Team Member'),
        subtitle: `${emp.department || 'Unassigned'} · ${emp.position || 'Team'}`,
        href: '/team',
      });
    }

    setEntries(nextEntries);
    setLoading(false);
  }, []);

  const openPalette = useCallback(() => {
    setQuery('');
    setActiveIndex(0);
    setOpen(true);
    void loadWorkspaceIndex();
  }, [loadWorkspaceIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, openPalette]);

  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  const rolePages = useMemo(() => {
    const pages = [...STATIC_PAGES];
    if (userRole === 'admin' || userRole === 'superadmin') {
      pages.push({
        id: 'page-admin-users',
        group: 'Pages',
        title: 'Admin Users & Provisioning',
        subtitle: 'Invite & manage company accounts',
        href: '/admin/users',
      });
    }
    if (userRole === 'superadmin') {
      pages.push({
        id: 'page-superadmin-companies',
        group: 'Pages',
        title: 'Superadmin Company Tenants',
        subtitle: 'Multi-tenant organization onboarding',
        href: '/superadmin/companies',
      });
    }
    return pages;
  }, [userRole]);

  const filtered = useMemo(() => {
    const all = [...rolePages, ...entries];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 18);
    return all
      .filter((item) =>
        `${item.group} ${item.title} ${item.subtitle} ${item.badge ?? ''}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 20);
  }, [rolePages, entries, query]);

  const clampedIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const renderGroupIcon = (group: CommandPaletteEntry['group']) => {
    switch (group) {
      case 'Tasks':
        return <ListTodo size={15} aria-hidden="true" />;
      case 'Meetings':
        return <CalendarDays size={15} aria-hidden="true" />;
      case 'Team':
        return <Users size={15} aria-hidden="true" />;
      default:
        return <Compass size={15} aria-hidden="true" />;
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={openPalette}
        aria-label="Open quick workspace search (Ctrl+K)"
      >
        <Search size={14} aria-hidden="true" />
        <span>Search</span>
        <kbd
          className="font-mono"
          style={{
            fontSize: '0.6875rem',
            padding: '0.0625rem 0.3125rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface-muted)',
          }}
        >
          Ctrl+K
        </kbd>
      </button>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Command Palette"
        subtitle="Jump to any page, task, meeting, or team member"
        size="md"
        autoFocusClose={false}
      >
        <div>
          <label htmlFor="cmdk-search-input" className="visually-hidden">
            Search workspace navigation, tasks, meetings, and team
          </label>
          <input
            id="cmdk-search-input"
            ref={inputRef}
            type="search"
            className="field-input"
            placeholder="Type a page, task title, code, meeting, or teammate..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) =>
                  filtered.length === 0 ? 0 : Math.min(filtered.length - 1, prev + 1)
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                const target = filtered[clampedIndex];
                if (target) {
                  navigateTo(target.href);
                }
              }
            }}
          />

          <div className="cmdk-list" role="listbox" aria-label="Workspace quick results">
            {loading && entries.length === 0 && (
              <div className="cmdk-group-title">Indexing workspace...</div>
            )}

            {filtered.length === 0 ? (
              <p className="card-subtitle" style={{ padding: '1rem' }}>
                No matching pages, tasks, meetings, or teammates.
              </p>
            ) : (
              filtered.map((item, idx) => {
                const showGroupHeader =
                  idx === 0 || filtered[idx - 1]?.group !== item.group;
                return (
                  <React.Fragment key={item.id}>
                    {showGroupHeader && (
                      <div className="cmdk-group-title">{item.group}</div>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={idx === clampedIndex}
                      data-active={idx === clampedIndex ? 'true' : 'false'}
                      className="cmdk-item"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigateTo(item.href)}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          minInlineSize: 0,
                        }}
                      >
                        <span className="text-secondary">{renderGroupIcon(item.group)}</span>
                        <span style={{ minInlineSize: 0 }}>
                          <span
                            style={{
                              display: 'block',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                            }}
                          >
                            {item.title}
                          </span>
                          <span className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                            {item.subtitle}
                          </span>
                        </span>
                      </span>
                      {item.badge && (
                        <span className="badge badge--neutral font-mono">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </ModalDialog>
    </>
  );
}
