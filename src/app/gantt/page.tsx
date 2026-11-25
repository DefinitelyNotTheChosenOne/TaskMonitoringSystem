'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import SortableTable, { TableColumn } from '@/components/ui/SortableTable';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useWorkspacePeriod } from '@/components/WorkspacePeriodProvider';
import { useToast } from '@/components/ui/ToastProvider';
import {
  TaskInput,
  TaskRecord,
  WorkspaceContext,
  getTodayISO,
} from '@/lib/types/task';
import {
  createTask,
  deleteTask,
  getWorkspaceContext,
  listTasks,
  updateTask,
} from '@/lib/api/tasks';

type ZoomScale = 'day' | 'week' | 'month';

function parseYmd(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function addDays(date: Date, delta: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + delta);
  return next;
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const GANTT_COLUMNS: TableColumn<TaskRecord>[] = [
  {
    key: 'task_code',
    label: 'Task ID',
    sortable: true,
    getSortValue: (r) => r.task_code,
    renderCell: (r) => <span className="font-mono text-accent">{r.task_code}</span>,
  },
  {
    key: 'title',
    label: 'Task',
    isRowHeader: true,
    sortable: true,
    getSortValue: (r) => r.title,
    renderCell: (r) => r.title,
    minWidth: '14rem',
  },
  {
    key: 'assignee',
    label: 'Person Assigned',
    sortable: true,
    getSortValue: (r) => r.assignee_name,
    renderCell: (r) => r.assignee_name,
  },
  {
    key: 'department',
    label: 'Department',
    sortable: true,
    getSortValue: (r) => r.department,
    renderCell: (r) => r.department,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    getSortValue: (r) => r.status,
    renderCell: (r) => (
      <span className={r.status === 'Completed' ? 'badge badge--success' : 'badge badge--info'}>
        <span className="badge-dot" aria-hidden="true" />
        <span>{r.status}</span>
      </span>
    ),
  },
  {
    key: 'progress',
    label: 'Progress',
    sortable: true,
    sortType: 'number',
    align: 'end',
    getSortValue: (r) => r.progress,
    renderCell: (r) => <span className="font-mono">{r.progress}%</span>,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    getSortValue: (r) => r.start_date,
    renderCell: (r) => <span className="font-mono">{r.start_date}</span>,
  },
  {
    key: 'due_date',
    label: 'Due Date',
    sortable: true,
    getSortValue: (r) => r.due_date,
    renderCell: (r) => <span className="font-mono">{r.due_date || '—'}</span>,
  },
];

export default function GanttChart() {
  const { todayFormatted, todayWeekday } = useWorkspacePeriod();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<'timeline' | 'table'>('timeline');
  const [zoom, setZoom] = useState<ZoomScale>('day');
  const [windowStart, setWindowStart] = useState<string>(() => {
    const d = addDays(new Date(), -7);
    return formatYmd(d);
  });

  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    task: TaskRecord | null;
  }>({ open: false, mode: 'create', task: null });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskRecord | null>(null);

  const reloadTasks = useCallback(async () => {
    const ctx = await getWorkspaceContext();
    const { tasks: rows, error } = await listTasks(ctx.employees);
    setWorkspace(ctx);
    if (error) {
      showToast({ title: 'Could not load Gantt schedule', description: error, tone: 'danger' });
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
        showToast({ title: 'Could not load Gantt schedule', description: error, tone: 'danger' });
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

  const employees = workspace?.employees ?? [];
  const categories = workspace?.categories ?? ['Project', 'Design', 'Meeting', 'Development'];
  const departments = workspace?.departments ?? ['Admin', 'Production', 'Marketing', 'Operations', 'Finance'];

  const detailTask = useMemo(
    () => (detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null),
    [detailTaskId, tasks]
  );

  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const sum = tasks.reduce((acc, t) => acc + t.progress, 0);
    return Math.round(sum / tasks.length);
  }, [tasks]);

  // Build timeline window columns & range
  const timelineMeta = useMemo(() => {
    const start = parseYmd(windowStart);
    const todayIso = getTodayISO();
    const todayDate = parseYmd(todayIso);

    let totalDays = 28;
    if (zoom === 'week') totalDays = 56;
    if (zoom === 'month') totalDays = 180;

    const end = addDays(start, totalDays - 1);

    const headers: { key: string; label: string; isToday: boolean }[] = [];
    if (zoom === 'day') {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(start, i);
        const iso = formatYmd(d);
        headers.push({
          key: iso,
          label: `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`,
          isToday: iso === todayIso,
        });
      }
    } else if (zoom === 'week') {
      for (let i = 0; i < 8; i++) {
        const wkStart = addDays(start, i * 7);
        const wkEnd = addDays(wkStart, 6);
        const containsToday = todayDate >= wkStart && todayDate <= wkEnd;
        headers.push({
          key: formatYmd(wkStart),
          label: `${wkStart.toLocaleString('en-US', { month: 'short' })} ${wkStart.getDate()}`,
          isToday: containsToday,
        });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const mDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const containsToday =
          todayDate.getFullYear() === mDate.getFullYear() &&
          todayDate.getMonth() === mDate.getMonth();
        headers.push({
          key: `${mDate.getFullYear()}-${mDate.getMonth()}`,
          label: mDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
          isToday: containsToday,
        });
      }
    }

    const totalMs = Math.max(1, end.getTime() - start.getTime() + 86_400_000);
    const todayOffsetPct = ((todayDate.getTime() - start.getTime()) / totalMs) * 100;

    return {
      start,
      end,
      totalMs,
      headers,
      todayOffsetPct: todayOffsetPct >= 0 && todayOffsetPct <= 100 ? todayOffsetPct : null,
      trackWidth: zoom === 'day' ? '74rem' : zoom === 'week' ? '56rem' : '54rem',
    };
  }, [windowStart, zoom]);

  const shiftWindow = (direction: -1 | 0 | 1) => {
    if (direction === 0) {
      setWindowStart(formatYmd(addDays(new Date(), -7)));
      return;
    }
    const stepDays = zoom === 'day' ? 14 : zoom === 'week' ? 28 : 60;
    setWindowStart(formatYmd(addDays(parseYmd(windowStart), direction * stepDays)));
  };

  const handleSaveTask = async (input: TaskInput) => {
    if (formState.mode === 'create') {
      const res = await createTask(input, workspace?.currentEmployee?.company_id);
      if (!res.ok) {
        showToast({ title: 'Could not create task', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Scheduled task created', description: input.title, tone: 'success' });
    } else if (formState.task) {
      const res = await updateTask(formState.task.id, input);
      if (!res.ok) {
        showToast({ title: 'Could not update schedule', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Schedule updated', description: input.title, tone: 'success' });
    }
    setFormState({ open: false, mode: 'create', task: null });
    await reloadTasks();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteTask(deleteTarget.id);
    if (!res.ok) {
      showToast({ title: 'Delete failed', description: res.error ?? undefined, tone: 'danger' });
    } else {
      if (detailTaskId === deleteTarget.id) setDetailTaskId(null);
      showToast({ title: 'Task removed', description: deleteTarget.title, tone: 'info' });
      await reloadTasks();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="gantt-page">
      <div className="gantt-toolbar">
        <div className="pill-cluster">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormState({ open: true, mode: 'create', task: null })}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New Task</span>
          </button>

          {activeView === 'timeline' && (
            <>
              <div className="segmented-control" role="group" aria-label="Timeline zoom scale">
                {(['day', 'week', 'month'] as ZoomScale[]).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    className="segmented-btn"
                    aria-pressed={zoom === scale}
                    onClick={() => setZoom(scale)}
                  >
                    {scale.charAt(0).toUpperCase() + scale.slice(1)}
                  </button>
                ))}
              </div>

              <div className="pill-cluster">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  aria-label="Previous timeline period"
                  onClick={() => shiftWindow(-1)}
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => shiftWindow(0)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  aria-label="Next timeline period"
                  onClick={() => shiftWindow(1)}
                >
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="segmented-control" role="group" aria-label="Gantt view mode">
          <button
            type="button"
            className="segmented-btn"
            aria-pressed={activeView === 'timeline'}
            onClick={() => setActiveView('timeline')}
          >
            Timeline Gantt
          </button>
          <button
            type="button"
            className="segmented-btn"
            aria-pressed={activeView === 'table'}
            onClick={() => setActiveView('table')}
          >
            Data Table
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-label="Schedule summary" className="gantt-summary-grid">
        <article className="surface-card surface-card--compact kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Date Today</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <CalendarDays size={16} />
            </span>
          </div>
          <div className="tasks-summary-value">{todayFormatted}</div>
          <span className="kpi-meta">{todayWeekday}</span>
        </article>

        <article className="surface-card surface-card--compact kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Overall Progress</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <Gauge size={16} />
            </span>
          </div>
          {loading ? (
            <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '1.375rem', marginBlockEnd: '0.375rem' }} />
          ) : (
            <div className="tasks-summary-value font-mono">{overallProgress}%</div>
          )}
          <progress
            className="native-progress"
            value={loading ? 0 : overallProgress}
            max={100}
            aria-label="Overall task schedule progress"
          />
        </article>

        <article className="surface-card surface-card--compact kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Timeline Window</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <SlidersHorizontal size={16} />
            </span>
          </div>
          <div className="tasks-summary-value font-mono">
            {formatYmd(timelineMeta.start)} → {formatYmd(timelineMeta.end)}
          </div>
          {loading ? (
            <div className="skeleton-bar" style={{ inlineSize: '6rem', blockSize: '0.75rem' }} />
          ) : (
            <span className="kpi-meta">{tasks.length} tracked tasks</span>
          )}
        </article>
      </section>

      {loading ? (
        <div className="surface-card form-stack" role="status" aria-live="polite">
          <span className="visually-hidden">Loading Gantt timeline...</span>
          <div className="skeleton-bars-stack" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((rowIdx) => (
              <div key={rowIdx} className="skeleton-bars-row">
                <div className="skeleton-bar" style={{ inlineSize: '11rem', blockSize: '1.25rem' }} />
                <div
                  className="skeleton-bar"
                  style={{
                    inlineSize: `${45 + ((rowIdx * 13) % 40)}%`,
                    blockSize: '1.5rem',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : activeView === 'table' ? (
        <article className="surface-card surface-card--flush">
          <SortableTable
            caption="Timeline schedule table"
            columns={GANTT_COLUMNS}
            rows={tasks}
            getRowKey={(r) => r.id}
            stickyFirstCol
          />
        </article>
      ) : tasks.length === 0 ? (
        <article className="surface-card empty-state-card">
          <h3>No scheduled tasks yet</h3>
          <p className="section-subtitle">
            Create a task with start and due dates to visualize its duration bar on the Gantt chart.
          </p>
        </article>
      ) : (
        <article className="surface-card surface-card--flush">
          <div
            className="gantt-split-scroll"
            tabIndex={0}
            role="region"
            aria-label="Interactive task Gantt chart"
          >
            <div
              className="gantt-split-canvas"
              style={
                {
                  '--gantt-cols': timelineMeta.headers.length,
                  '--gantt-track-width': timelineMeta.trackWidth,
                } as React.CSSProperties
              }
            >
              <div className="gantt-split-header">
                <div className="gantt-sticky-cell">Task &amp; Owner</div>
                <div className="gantt-timeline-head-cells">
                  {timelineMeta.headers.map((col) => (
                    <div
                      key={col.key}
                      className={`gantt-head-cell font-mono ${col.isToday ? 'gantt-head-cell--today' : ''}`}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
              </div>

              {tasks.map((task) => {
                const startDate = parseYmd(task.start_date || task.assigned_on || getTodayISO());
                const rawEnd = parseYmd(task.due_date || task.start_date || task.assigned_on || getTodayISO());
                const endDate = rawEnd < startDate ? startDate : addDays(rawEnd, 1);

                const rawLeftPct =
                  ((startDate.getTime() - timelineMeta.start.getTime()) / timelineMeta.totalMs) *
                  100;
                const rawRightPct =
                  ((endDate.getTime() - timelineMeta.start.getTime()) / timelineMeta.totalMs) *
                  100;

                const clampedLeft = Math.max(0, Math.min(100, rawLeftPct));
                const clampedRight = Math.max(0, Math.min(100, rawRightPct));
                const widthPct = clampedRight - clampedLeft;
                const visibleInWindow = widthPct > 0;

                return (
                  <div key={task.id} className="gantt-split-row">
                    <div className="gantt-sticky-cell">
                      <button
                        type="button"
                        className="task-title-btn"
                        onClick={() => setDetailTaskId(task.id)}
                      >
                        {task.title}
                      </button>
                      <span className="card-subtitle font-mono">
                        {task.task_code} · {task.assignee_name}
                      </span>
                    </div>

                    <div className="gantt-track-row">
                      {timelineMeta.todayOffsetPct !== null && (
                        <div
                          className="gantt-today-line"
                          style={{ insetInlineStart: `${timelineMeta.todayOffsetPct}%` }}
                          aria-hidden="true"
                        />
                      )}

                      {visibleInWindow && (
                        <button
                          type="button"
                          className="gantt-bar-btn"
                          style={{
                            insetInlineStart: `${clampedLeft}%`,
                            inlineSize: `max(4.5rem, ${widthPct}%)`,
                          }}
                          onClick={() => setFormState({ open: true, mode: 'edit', task })}
                          aria-label={`Edit schedule for ${task.title}, ${task.progress}% complete`}
                        >
                          <span
                            className="gantt-bar-fill"
                            style={{ inlineSize: `${task.progress}%` }}
                            aria-hidden="true"
                          />
                          <span className="gantt-bar-label">
                            <span>{task.title}</span>
                            <span className="font-mono">{task.progress}%</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      )}

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
        onDelete={(task) => setDeleteTarget(task)}
        onTaskUpdated={reloadTasks}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        description="This permanently deletes the scheduled task."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
