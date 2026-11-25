'use client';

import React, { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';
import { useWorkspacePeriod } from '@/components/WorkspacePeriodProvider';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskInput,
  TaskRecord,
  WorkspaceContext,
  computeDashboardAnalytics,
  computeDaysLeft,
  getTaskWeekBuckets,
  isTaskOverdue,
  toISODateOnly,
} from '@/lib/types/task';
import {
  bulkDeleteTasks,
  bulkUpdateTasks,
  createTask,
  deleteTask,
  getWorkspaceContext,
  importTasksBatch,
  listTasks,
  updateTask,
} from '@/lib/api/tasks';
import {
  exportTasksToCsv,
  exportTasksToExcel,
  parseTasksFromSpreadsheet,
} from '@/lib/excelTasks';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type ScopeFilter = 'all' | 'period' | 'mine' | 'overdue' | 'ongoing' | 'upcoming' | 'today';

type SortKey =
  | 'task_code'
  | 'title'
  | 'assignee_name'
  | 'category'
  | 'priority'
  | 'department'
  | 'due_date'
  | 'days_left'
  | 'assigned_on'
  | 'status'
  | 'progress'
  | 'remarks';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const PRIORITY_RANK: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  'Very High': 4,
  Critical: 5,
};

function getDaysLeftBadge(daysLeft: number | null, status: string) {
  if (status === 'Completed') {
    return <span className="badge badge--success">Done</span>;
  }
  if (status === 'Cancelled') {
    return <span className="badge badge--neutral">Cancelled</span>;
  }
  if (daysLeft === null) {
    return <span className="text-secondary">—</span>;
  }
  if (daysLeft < 0) {
    return <span className="badge badge--danger font-mono">{Math.abs(daysLeft)}d overdue</span>;
  }
  if (daysLeft === 0) {
    return <span className="badge badge--warning font-mono">Today</span>;
  }
  if (daysLeft <= 2) {
    return <span className="badge badge--urgent font-mono">{daysLeft}d</span>;
  }
  return <span className="font-mono">{daysLeft}d</span>;
}

function TasksBoardContent() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get('filter');
  const validInitialScope: ScopeFilter =
    initialParam === 'overdue' ||
    initialParam === 'ongoing' ||
    initialParam === 'upcoming' ||
    initialParam === 'today' ||
    initialParam === 'mine' ||
    initialParam === 'period'
      ? initialParam
      : 'all';

  const { month, year, todayFormatted, todayWeekday } = useWorkspacePeriod();
  const { showToast } = useToast();
  const captionId = useId();
  const importInputRef = useRef<HTMLInputElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeOverride, setScopeOverride] = useState<ScopeFilter | null>(null);
  const scopeFilter = scopeOverride ?? validInitialScope;
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Sorting & Selection
  const [sort, setSort] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [sortStatus, setSortStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    task: TaskRecord | null;
  }>({ open: false, mode: 'create', task: null });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'single'; task: TaskRecord }
    | { type: 'bulk'; ids: string[] }
    | null
  >(null);

  const loadWorkspaceAndTasks = useCallback(async () => {
    const ctx = await getWorkspaceContext();
    const { tasks: rows, error } = await listTasks(ctx.employees);
    setWorkspace(ctx);
    if (error) {
      showToast({ title: 'Could not load tasks', description: error, tone: 'danger' });
    } else {
      setTasks(rows);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    let active = true;
    async function init() {
      const ctx = await getWorkspaceContext();
      const { tasks: rows, error } = await listTasks(ctx.employees);
      if (!active) return;
      setWorkspace(ctx);
      if (error) {
        showToast({ title: 'Could not load tasks', description: error, tone: 'danger' });
      } else {
        setTasks(rows);
      }
      setLoading(false);
    }
    void init();
    return () => {
      active = false;
    };
  }, [showToast]);

  const userId = workspace?.userId ?? null;
  const categories = useMemo(
    () =>
      workspace?.categories ?? [
        'Project',
        'Design',
        'Meeting',
        'Development',
        'Client Work',
        'Support',
      ],
    [workspace]
  );
  const departments = useMemo(
    () =>
      workspace?.departments ?? [
        'Admin',
        'Production',
        'Marketing',
        'Operations',
        'Finance',
      ],
    [workspace]
  );
  const employees = workspace?.employees ?? [];
  const detailTask = useMemo(
    () => (detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null),
    [detailTaskId, tasks]
  );

  const analytics = useMemo(
    () =>
      computeDashboardAnalytics(
        tasks,
        month,
        year,
        userId,
        categories,
        departments
      ),
    [tasks, month, year, userId, categories, departments]
  );

  const filteredTasks = useMemo(() => {
    const monthIdx = Math.max(0, MONTH_NAMES.indexOf(month));
    const ymPrefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const q = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (q) {
        const hay = `${task.task_code} ${task.title} ${task.description} ${task.assignee_name} ${task.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (scopeFilter === 'mine' && userId && task.assignee_id !== userId) {
        return false;
      }
      if (scopeFilter === 'overdue' && !isTaskOverdue(task)) {
        return false;
      }
      if (scopeFilter === 'ongoing' && !getTaskWeekBuckets(task).ongoingThisWeek) {
        return false;
      }
      if (scopeFilter === 'upcoming' && !getTaskWeekBuckets(task).upcomingNextWeek) {
        return false;
      }
      if (scopeFilter === 'today' && !getTaskWeekBuckets(task).dueToday) {
        return false;
      }
      if (scopeFilter === 'period') {
        const refDate = task.due_date || toISODateOnly(task.created_at);
        if (!refDate.startsWith(ymPrefix)) return false;
      }

      if (statusFilter !== 'All' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;
      if (departmentFilter !== 'All' && task.department !== departmentFilter) return false;
      if (assigneeFilter === 'Unassigned' && task.assignee_id !== null) return false;
      if (assigneeFilter !== 'All' && assigneeFilter !== 'Unassigned' && task.assignee_id !== assigneeFilter) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    scopeFilter,
    userId,
    month,
    year,
    statusFilter,
    priorityFilter,
    categoryFilter,
    departmentFilter,
    assigneeFilter,
  ]);

  const sortedTasks = useMemo(() => {
    if (!sort) return filteredTasks;
    const factor = sort.direction === 'ascending' ? 1 : -1;

    return filteredTasks.toSorted((a, b) => {
      if (sort.key === 'progress') {
        return factor * (a.progress - b.progress);
      }
      if (sort.key === 'days_left') {
        const da = computeDaysLeft(a.due_date) ?? 99999;
        const db = computeDaysLeft(b.due_date) ?? 99999;
        return factor * (da - db);
      }
      if (sort.key === 'priority') {
        return factor * ((PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0));
      }
      const av = String(a[sort.key] ?? '');
      const bv = String(b[sort.key] ?? '');
      return factor * collator.compare(av, bv);
    });
  }, [filteredTasks, sort]);

  // Keep select-all checkbox indeterminate state in sync (checkbox guide)
  const visibleIds = useMemo(() => sortedTasks.map((t) => t.id), [sortedTasks]);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleSort = (key: SortKey, label: string) => {
    const direction =
      sort?.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    setSort({ key, direction });
    setSortStatus(`Sorted by ${label}, ${direction}, ${sortedTasks.length} rows`);
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const toggleRowSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSaveTask = async (input: TaskInput) => {
    if (formState.mode === 'create') {
      const res = await createTask(input, workspace?.currentEmployee?.company_id);
      if (!res.ok) {
        showToast({ title: 'Failed to create task', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({
        title: 'Task created',
        description: res.migrationRequired
          ? 'Saved core fields. Run supabase_migration.sql to store extended fields.'
          : input.title,
        tone: res.migrationRequired ? 'warning' : 'success',
      });
    } else if (formState.task) {
      const res = await updateTask(formState.task.id, input);
      if (!res.ok) {
        showToast({ title: 'Failed to update task', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Task updated', description: input.title, tone: 'success' });
    }
    setFormState({ open: false, mode: 'create', task: null });
    await loadWorkspaceAndTasks();
  };

  const handleInlineUpdate = async (
    task: TaskRecord,
    patch: Partial<TaskInput>,
    fieldLabel: string
  ) => {
    const res = await updateTask(task.id, patch);
    if (!res.ok) {
      showToast({
        title: `Could not update ${fieldLabel}`,
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }
    showToast({
      title: `${task.task_code} updated`,
      description: `${fieldLabel} updated.`,
      tone: 'success',
    });
    await loadWorkspaceAndTasks();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      const res = await deleteTask(deleteTarget.task.id);
      if (!res.ok) {
        showToast({ title: 'Failed to delete task', description: res.error ?? undefined, tone: 'danger' });
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.task.id);
          return next;
        });
        if (detailTaskId === deleteTarget.task.id) setDetailTaskId(null);
        showToast({ title: 'Task deleted', description: deleteTarget.task.title, tone: 'info' });
        await loadWorkspaceAndTasks();
      }
    } else {
      const res = await bulkDeleteTasks(deleteTarget.ids);
      if (!res.ok) {
        showToast({ title: 'Bulk delete failed', description: res.error ?? undefined, tone: 'danger' });
      } else {
        setSelectedIds(new Set());
        showToast({
          title: `Deleted ${deleteTarget.ids.length} tasks`,
          tone: 'info',
        });
        await loadWorkspaceAndTasks();
      }
    }
    setDeleteTarget(null);
  };

  const handleBulkPatch = async (patch: Partial<TaskInput>, label: string) => {
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateTasks(ids, patch);
    if (!res.ok) {
      showToast({ title: 'Bulk update failed', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    showToast({ title: `Updated ${ids.length} tasks`, description: label, tone: 'success' });
    setSelectedIds(new Set());
    await loadWorkspaceAndTasks();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = await parseTasksFromSpreadsheet(file, employees);
      if (parsed.length === 0) {
        showToast({
          title: 'No importable rows found',
          description: 'Ensure the spreadsheet has a Task or Task Description column.',
          tone: 'warning',
        });
        return;
      }
      const res = await importTasksBatch(parsed, workspace?.currentEmployee?.company_id);
      if (res.error) {
        showToast({ title: 'Import failed', description: res.error, tone: 'danger' });
        return;
      }
      showToast({
        title: `Imported ${res.count} tasks`,
        description: res.migrationRequired
          ? 'Run supabase_migration.sql to persist category, department, and progress.'
          : file.name,
        tone: res.migrationRequired ? 'warning' : 'success',
      });
      await loadWorkspaceAndTasks();
    } catch (err) {
      showToast({
        title: 'Could not parse spreadsheet',
        description: err instanceof Error ? err.message : 'Invalid file format',
        tone: 'danger',
      });
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    scopeFilter !== 'all' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    departmentFilter !== 'All' ||
    assigneeFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setScopeOverride('all');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setDepartmentFilter('All');
    setAssigneeFilter('All');
  };

  const renderSortButton = (key: SortKey, label: string) => {
    const isSorted = sort?.key === key;
    return (
      <button
        type="button"
        className="table-sort-btn"
        onClick={() => handleSort(key, label)}
      >
        <span>{label}</span>
        {isSorted ? (
          sort.direction === 'ascending' ? (
            <ArrowUp size={14} aria-hidden="true" className="sort-icon sort-icon--active" />
          ) : (
            <ArrowDown size={14} aria-hidden="true" className="sort-icon sort-icon--active" />
          )
        ) : (
          <ArrowUpDown size={14} aria-hidden="true" className="sort-icon" />
        )}
      </button>
    );
  };

  return (
    <div className="tasks-page">
      {workspace && !workspace.schemaReady && !bannerDismissed && (
        <div className="info-banner" role="status">
          <div className="info-banner-copy">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              Extended columns &amp; checklists require running <code>supabase_migration.sql</code> in
              your Supabase SQL Editor. Core task actions still work safely.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setBannerDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live KPI Summary Strip */}
      <section aria-label="Tasks summary" className="tasks-summary-bar">
        <article className="surface-card surface-card--compact">
          <div className="tasks-summary-label">
            {todayFormatted} · {todayWeekday}
          </div>
          {loading ? (
            <div className="skeleton-bar" style={{ inlineSize: '9rem', blockSize: '1.375rem' }} />
          ) : (
            <div className="tasks-summary-value">
              <span className="font-mono">{analytics.dueTodayCount}</span> Tasks Due Today
            </div>
          )}
        </article>

        <article className="surface-card surface-card--compact">
          <div className="tasks-summary-label">Due Today by Priority</div>
          {loading ? (
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <div className="skeleton-bar" style={{ inlineSize: '4rem', blockSize: '1.375rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '4rem', blockSize: '1.375rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '4rem', blockSize: '1.375rem' }} />
            </div>
          ) : (
            <div className="pill-cluster">
              {analytics.dueTodayByPriority.map((item) => (
                <span key={item.label} className={`badge badge--${item.tone} font-mono`}>
                  {item.label}: {item.count}
                </span>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card surface-card--compact">
          <div className="tasks-summary-label">Overall Completion</div>
          {loading ? (
            <div className="skeleton-bar" style={{ inlineSize: '7rem', blockSize: '1.375rem' }} />
          ) : (
            <div className="tasks-summary-value font-mono">
              {analytics.completedTasks}/{analytics.totalTasks} ({analytics.completionRate}%)
            </div>
          )}
        </article>

        <article className="surface-card surface-card--compact">
          <div className="tasks-summary-label">Overdue Tasks</div>
          {loading ? (
            <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '1.375rem' }} />
          ) : (
            <div
              className="tasks-summary-value font-mono"
              style={{
                color:
                  analytics.overdueCount > 0 ? 'var(--status-danger)' : 'var(--status-success)',
              }}
            >
              {analytics.overdueCount}
            </div>
          )}
        </article>
      </section>

      {/* Primary Action Toolbar */}
      <div className="tasks-toolbar">
        <div className="pill-cluster">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormState({ open: true, mode: 'create', task: null })}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New Task</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAnalyticsOpen(true)}
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span>Status Analytics</span>
          </button>
        </div>

        <div className="pill-cluster">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="visually-hidden"
            aria-label="Import tasks from Excel or CSV file"
            onChange={(e) => void handleImportFile(e)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={15} aria-hidden="true" />
            <span>Import .xlsx</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void exportTasksToExcel(sortedTasks, `tasks-${month}-${year}.xlsx`)}
            disabled={sortedTasks.length === 0}
          >
            <FileSpreadsheet size={15} aria-hidden="true" />
            <span>Export .xlsx</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void exportTasksToCsv(sortedTasks, `tasks-${month}-${year}.csv`)}
            disabled={sortedTasks.length === 0}
          >
            <Download size={15} aria-hidden="true" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Search, Scope & Attribute Filters */}
      <section className="surface-card surface-card--compact" aria-label="Filter tasks">
        <div className="filter-bar">
          <div className="search-wrap">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search tasks by ID, title, description, or assignee"
              className="field-input search-input"
              placeholder="Search tasks, codes, or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by timeframe or owner scope"
            className="field-select field-select--compact"
            value={scopeFilter}
            onChange={(e) => setScopeOverride(e.target.value as ScopeFilter)}
          >
            <option value="all">All Tasks</option>
            <option value="period">Period ({month} {year})</option>
            <option value="mine">My Tasks</option>
            <option value="today">Due Today</option>
            <option value="ongoing">Ongoing This Week</option>
            <option value="upcoming">Upcoming Next Week</option>
            <option value="overdue">Overdue Only</option>
          </select>

          <select
            aria-label="Filter by status"
            className="field-select field-select--compact"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            className="field-select field-select--compact"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            className="field-select field-select--compact"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            aria-label="Filter by department"
            className="field-select field-select--compact"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            aria-label="Filter by assignee"
            className="field-select field-select--compact"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="All">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <section className="bulk-bar" aria-label="Bulk task actions">
          <strong className="font-mono">{selectedIds.size} selected</strong>
          <div className="bulk-bar-actions">
            <select
              aria-label="Bulk change status"
              className="field-select field-select--compact"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                void handleBulkPatch({ status: e.target.value }, `Status → ${e.target.value}`);
                e.target.value = '';
              }}
            >
              <option value="">Set Status...</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              aria-label="Bulk change priority"
              className="field-select field-select--compact"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                void handleBulkPatch({ priority: e.target.value }, `Priority → ${e.target.value}`);
                e.target.value = '';
              }}
            >
              <option value="">Set Priority...</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              aria-label="Bulk reassign tasks"
              className="field-select field-select--compact"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                const val = e.target.value === '__none__' ? null : e.target.value;
                void handleBulkPatch({ assignee_id: val }, 'Reassigned tasks');
                e.target.value = '';
              }}
            >
              <option value="">Reassign to...</option>
              <option value="__none__">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setDeleteTarget({ type: 'bulk', ids: Array.from(selectedIds) })}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Delete Selected</span>
            </button>
          </div>
        </section>
      )}

      {/* Main Live Tasks Table */}
      <article className="surface-card surface-card--flush" style={{ flex: 1, minBlockSize: 0 }}>
        <div role="status" className="visually-hidden">
          {sortStatus}
        </div>
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="table-region table-region--sticky-col"
          style={{ '--table-max-block-size': 'calc(100dvh - 24rem)' } as React.CSSProperties}
        >
          <table className="data-table">
            <caption id={captionId} className="visually-hidden">
              Live team tasks board
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ inlineSize: '3rem' }}>
                  <label className="checkbox-hit-target" aria-label="Select all visible tasks">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="checkbox-input"
                      checked={allVisibleSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </label>
                </th>
                <th scope="col" aria-sort={sort?.key === 'task_code' ? sort.direction : undefined}>
                  {renderSortButton('task_code', 'Task ID')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'title' ? sort.direction : undefined} style={{ minInlineSize: '14rem' }}>
                  {renderSortButton('title', 'Task')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'assignee_name' ? sort.direction : undefined} style={{ minInlineSize: '10rem' }}>
                  {renderSortButton('assignee_name', 'Person Assigned')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'category' ? sort.direction : undefined}>
                  {renderSortButton('category', 'Category')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'priority' ? sort.direction : undefined}>
                  {renderSortButton('priority', 'Priority')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'department' ? sort.direction : undefined}>
                  {renderSortButton('department', 'Department')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'due_date' ? sort.direction : undefined}>
                  {renderSortButton('due_date', 'Due Date')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'days_left' ? sort.direction : undefined}>
                  {renderSortButton('days_left', 'Days Left')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'assigned_on' ? sort.direction : undefined}>
                  {renderSortButton('assigned_on', 'Assigned On')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'status' ? sort.direction : undefined}>
                  {renderSortButton('status', 'Status')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'progress' ? sort.direction : undefined}>
                  {renderSortButton('progress', 'Progress')}
                </th>
                <th scope="col" aria-sort={sort?.key === 'remarks' ? sort.direction : undefined}>
                  {renderSortButton('remarks', 'Remarks')}
                </th>
                <th scope="col" className="cell-align-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0, 1, 2, 3, 4].map((rowIdx) => (
                  <tr key={rowIdx} aria-hidden="true">
                    <td colSpan={14}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="skeleton-bar" style={{ inlineSize: '1.125rem', blockSize: '1.125rem' }} />
                        <div className="skeleton-bar" style={{ inlineSize: '4.5rem', blockSize: '1rem' }} />
                        <div className="skeleton-bar" style={{ inlineSize: '14rem', blockSize: '1rem' }} />
                        <div className="skeleton-bar" style={{ inlineSize: '7.5rem', blockSize: '1rem' }} />
                        <div className="skeleton-bar" style={{ inlineSize: '6rem', blockSize: '1rem' }} />
                        <div className="skeleton-bar" style={{ inlineSize: '6.5rem', blockSize: '1rem' }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={14} className="table-empty-cell">
                    No tasks match your filters. Create a task or reset filters to view all items.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const daysLeft = computeDaysLeft(task.due_date);
                  const checked = selectedIds.has(task.id);
                  return (
                    <tr key={task.id} className="data-table-row">
                      <th scope="row" className="table-row-header">
                        <label className="checkbox-hit-target" aria-label={`Select ${task.title}`}>
                          <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={checked}
                            onChange={(e) => toggleRowSelect(task.id, e.target.checked)}
                          />
                        </label>
                      </th>
                      <td className="font-mono text-accent">{task.task_code}</td>
                      <td>
                        <button
                          type="button"
                          className="task-title-btn"
                          onClick={() => setDetailTaskId(task.id)}
                        >
                          {task.title}
                        </button>
                      </td>
                      <td>{task.assignee_name}</td>
                      <td>
                        <span className="badge badge--accent">{task.category}</span>
                      </td>
                      <td>
                        <select
                          aria-label={`Change priority for ${task.title}`}
                          className="inline-select"
                          value={task.priority}
                          onChange={(e) =>
                            void handleInlineUpdate(task, { priority: e.target.value }, 'priority')
                          }
                        >
                          {TASK_PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td>{task.department}</td>
                      <td className="font-mono">{task.due_date || '—'}</td>
                      <td>{getDaysLeftBadge(daysLeft, task.status)}</td>
                      <td className="font-mono text-secondary">{task.assigned_on || '—'}</td>
                      <td>
                        <select
                          aria-label={`Change status for ${task.title}`}
                          className="inline-select"
                          value={task.status}
                          onChange={(e) =>
                            void handleInlineUpdate(task, { status: e.target.value }, 'status')
                          }
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="font-mono">{task.progress}%</td>
                      <td>
                        <span className={task.remarks === 'Closed' ? 'badge badge--success' : 'badge badge--neutral'}>
                          {task.remarks}
                        </span>
                      </td>
                      <td className="cell-align-end">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => setFormState({ open: true, mode: 'edit', task })}
                          >
                            <Edit3 size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            aria-label={`Delete ${task.title}`}
                            onClick={() => setDeleteTarget({ type: 'single', task })}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Live Status & Distribution Analytics Dialog */}
      <ModalDialog
        open={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        title="Task Status & Distribution"
        subtitle={`Live breakdown across ${analytics.totalTasks} tasks (${month} ${year})`}
        size="xl"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsAnalyticsOpen(false)}
          >
            Close
          </button>
        }
      >
        <div className="analytics-grid">
          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Tasks by Status
            </h3>
            <div className="meter-stack">
              {analytics.statusData.map((item) => {
                const pct =
                  analytics.totalTasks > 0
                    ? `${Math.round((item.tasks / analytics.totalTasks) * 100)}%`
                    : '0%';
                return (
                  <div key={item.name} className="meter-row">
                    <div className="meter-row-head">
                      <span>{item.name}</span>
                      <span className="badge badge--neutral font-mono">{item.tasks}</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ inlineSize: pct }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Distribution by Category
            </h3>
            <div className="meter-stack">
              {analytics.categoryData.map((item) => {
                const pct =
                  analytics.totalTasks > 0
                    ? `${Math.round((item.total / analytics.totalTasks) * 100)}%`
                    : '0%';
                return (
                  <div key={item.name} className="meter-row">
                    <div className="meter-row-head">
                      <span>{item.name}</span>
                      <strong className="font-mono">{item.total}</strong>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ inlineSize: pct }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Distribution by Priority
            </h3>
            <div className="meter-stack">
              {TASK_PRIORITIES.map((label) => {
                const count = analytics.priorityData.find((p) => p.name === label)?.value ?? 0;
                const tone =
                  label === 'Critical'
                    ? 'danger'
                    : label === 'Very High'
                      ? 'urgent'
                      : label === 'High'
                        ? 'warning'
                        : label === 'Medium'
                          ? 'info'
                          : 'success';
                return (
                  <div
                    key={label}
                    className="muted-well"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span className={`badge badge--${tone}`}>
                      <span className="badge-dot" aria-hidden="true" />
                      <span>{label}</span>
                    </span>
                    <strong className="font-mono">{count}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Distribution by Department
            </h3>
            <div className="meter-stack">
              {analytics.departmentData.map((item) => {
                const pct =
                  analytics.totalTasks > 0
                    ? `${Math.round((item.total / analytics.totalTasks) * 100)}%`
                    : '0%';
                return (
                  <div key={item.name} className="dept-row">
                    <span className="dept-label">{item.name}</span>
                    <div className="meter-track" style={{ flex: 1 }}>
                      <div className="meter-fill" style={{ inlineSize: pct }} />
                    </div>
                    <span className="dept-count font-mono">{item.total}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Distribution by Remarks
            </h3>
            <div className="split-stat-grid">
              <div className="split-stat-box">
                <span className="tasks-summary-label">Open Tasks</span>
                <span className="split-stat-num font-mono">{analytics.openTasks}</span>
              </div>
              <div className="split-stat-box">
                <span className="tasks-summary-label">Closed Tasks</span>
                <span className="split-stat-num font-mono">{analytics.closedTasks}</span>
              </div>
            </div>
          </section>

          <section className="surface-card surface-card--compact">
            <h3 className="card-title" style={{ marginBlockEnd: '0.875rem' }}>
              Yearly Performance Breakdown ({year})
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Total</th>
                  <th scope="col">Done</th>
                  <th scope="col">Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.yearlyData.filter((m) => m.total > 0 || m.completed > 0).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty-cell">
                      No tasks recorded for {year}.
                    </td>
                  </tr>
                ) : (
                  analytics.yearlyData
                    .filter((m) => m.total > 0 || m.completed > 0)
                    .map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td className="font-mono">{row.total}</td>
                        <td className="font-mono">{row.completed}</td>
                        <td className="font-mono">{row.rate}%</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </ModalDialog>

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        key={`${formState.mode}-${formState.task?.id ?? 'new'}-${formState.open ? '1' : '0'}`}
        open={formState.open}
        mode={formState.mode}
        initialTask={formState.task}
        employees={employees}
        categories={categories}
        departments={departments}
        onClose={() => setFormState({ open: false, mode: 'create', task: null })}
        onSubmit={handleSaveTask}
      />

      {/* Task Detail Modal (Subtasks + Comments) */}
      <TaskDetailModal
        task={detailTask}
        companyId={workspace?.currentEmployee?.company_id}
        currentUser={{
          id: workspace?.userId,
          name: workspace?.currentEmployee?.name ?? 'Team Member',
        }}
        onClose={() => setDetailTaskId(null)}
        onEdit={(task) => {
          setDetailTaskId(null);
          setFormState({ open: true, mode: 'edit', task });
        }}
        onDelete={(task) => setDeleteTarget({ type: 'single', task })}
        onTaskUpdated={loadWorkspaceAndTasks}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'bulk'
            ? `Delete ${deleteTarget.ids.length} selected tasks?`
            : `Delete "${deleteTarget?.task.title ?? ''}"?`
        }
        description="This action permanently removes the selected task(s) and their checklist items."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function TasksBoard() {
  return (
    <Suspense
      fallback={
        <div className="surface-card">
          <p className="card-subtitle">Loading Tasks Board...</p>
        </div>
      }
    >
      <TasksBoardContent />
    </Suspense>
  );
}
