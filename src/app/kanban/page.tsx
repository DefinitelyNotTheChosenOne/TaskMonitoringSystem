'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  GripVertical,
  Plus,
  Search,
} from 'lucide-react';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskInput,
  TaskRecord,
  WorkspaceContext,
  getTodayISO,
  isTaskOverdue,
} from '@/lib/types/task';
import {
  createTask,
  deleteTask,
  getWorkspaceContext,
  listTasks,
  updateTask,
} from '@/lib/api/tasks';

const CORE_COLUMNS = [
  { name: 'Not Started', dotColor: 'var(--status-neutral)' },
  { name: 'In Progress', dotColor: 'var(--status-info)' },
  { name: 'In Review', dotColor: 'var(--status-warning)' },
  { name: 'Completed', dotColor: 'var(--status-success)' },
] as const;

const ALL_COLUMNS = [
  { name: 'Not Started', dotColor: 'var(--status-neutral)' },
  { name: 'In Progress', dotColor: 'var(--status-info)' },
  { name: 'On Hold', dotColor: 'var(--status-warning)' },
  { name: 'Active', dotColor: 'var(--accent)' },
  { name: 'In Review', dotColor: 'var(--status-urgent)' },
  { name: 'Completed', dotColor: 'var(--status-success)' },
  { name: 'Overdue', dotColor: 'var(--status-danger)' },
  { name: 'Cancelled', dotColor: 'var(--status-neutral)' },
] as const;

function getPriorityBadge(priority: string): string {
  switch (priority) {
    case 'Critical':
      return 'badge badge--danger';
    case 'Very High':
      return 'badge badge--urgent';
    case 'High':
      return 'badge badge--warning';
    case 'Medium':
      return 'badge badge--info';
    default:
      return 'badge badge--success';
  }
}

export default function KanbanBoard() {
  const { showToast } = useToast();

  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnMode, setColumnMode] = useState<'core' | 'all'>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [quickDrafts, setQuickDrafts] = useState<Record<string, string>>({});
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  // Pointer drag state (drag-and-drop guide)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dropColumn, setDropColumn] = useState<string | null>(null);
  const dragSessionRef = useRef<{
    taskId: string;
    originStatus: string;
    pointerId: number;
    startX: number;
    startY: number;
    handleEl: HTMLButtonElement;
  } | null>(null);

  // Modals
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
      showToast({ title: 'Could not load Kanban tasks', description: error, tone: 'danger' });
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
        showToast({ title: 'Could not load Kanban tasks', description: error, tone: 'danger' });
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

  const columns = columnMode === 'core' ? CORE_COLUMNS : ALL_COLUMNS;
  const employees = workspace?.employees ?? [];
  const categories = workspace?.categories ?? ['Project', 'Design', 'Meeting', 'Development'];
  const departments = workspace?.departments ?? ['Admin', 'Production', 'Marketing', 'Operations', 'Finance'];

  const detailTask = useMemo(
    () => (detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null),
    [detailTaskId, tasks]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      if (assigneeFilter === 'Unassigned' && task.assignee_id !== null) return false;
      if (
        assigneeFilter !== 'All' &&
        assigneeFilter !== 'Unassigned' &&
        task.assignee_id !== assigneeFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${task.task_code} ${task.title} ${task.assignee_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, searchQuery]);

  const moveTaskToStatus = useCallback(
    async (taskId: string, nextStatus: string) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing || existing.status === nextStatus) return;

      // Optimistic move
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: nextStatus,
                progress: nextStatus === 'Completed' ? 100 : t.progress,
                remarks: nextStatus === 'Completed' ? 'Closed' : t.remarks,
              }
            : t
        )
      );
      setStatusAnnouncement(`Moved ${existing.title} to ${nextStatus}`);

      const res = await updateTask(taskId, { status: nextStatus });
      if (!res.ok) {
        showToast({
          title: 'Failed to move task',
          description: res.error ?? undefined,
          tone: 'danger',
        });
        await reloadTasks();
        return;
      }
      showToast({
        title: `${existing.task_code} → ${nextStatus}`,
        tone: 'success',
      });
    },
    [tasks, showToast, reloadTasks]
  );

  const endDrag = useCallback(() => {
    document.documentElement.classList.remove('is-dragging-kanban');
    dragSessionRef.current = null;
    setDraggingTaskId(null);
    setDragOffset({ x: 0, y: 0 });
    setDropColumn(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragSessionRef.current) {
        e.preventDefault();
        setStatusAnnouncement('Card drag cancelled');
        endDrag();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.classList.remove('is-dragging-kanban');
    };
  }, [endDrag]);

  const handleDragPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    task: TaskRecord
  ) => {
    if (e.button !== 0 || dragSessionRef.current) return;
    e.preventDefault();
    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors on synthetic events
    }
    dragSessionRef.current = {
      taskId: task.id,
      originStatus: task.status,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      handleEl,
    };
    document.documentElement.classList.add('is-dragging-kanban');
    setDraggingTaskId(task.id);
    setDragOffset({ x: 0, y: 0 });
    setDropColumn(task.status);
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session || e.pointerId !== session.pointerId) return;

    setDragOffset({
      x: e.clientX - session.startX,
      y: e.clientY - session.startY,
    });

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const colEl = el?.closest<HTMLElement>('[data-kanban-column]');
    const hoveredCol = colEl?.dataset.kanbanColumn ?? null;
    setDropColumn(hoveredCol);
  };

  const handleDragPointerUp = async (e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session || e.pointerId !== session.pointerId) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const colEl = el?.closest<HTMLElement>('[data-kanban-column]');
    const targetStatus = colEl?.dataset.kanbanColumn ?? null;
    const { taskId, originStatus, handleEl, pointerId } = session;

    try {
      if (handleEl.hasPointerCapture(pointerId)) {
        handleEl.releasePointerCapture(pointerId);
      }
    } catch {
      // Ignore release errors
    }

    endDrag();

    if (targetStatus && targetStatus !== originStatus) {
      await moveTaskToStatus(taskId, targetStatus);
    }
  };

  const handleDragPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session || e.pointerId !== session.pointerId) return;
    endDrag();
  };

  const handleQuickAdd = async (columnName: string) => {
    const title = (quickDrafts[columnName] ?? '').trim();
    if (!title) return;

    const res = await createTask(
      {
        title,
        status: columnName,
        priority: 'Medium',
        category: categories[0] ?? 'Project',
        department: departments[0] ?? 'Operations',
        assignee_id: null,
        start_date: getTodayISO(),
        assigned_on: getTodayISO(),
        progress: columnName === 'Completed' ? 100 : 0,
        remarks: columnName === 'Completed' ? 'Closed' : 'Open',
      },
      workspace?.currentEmployee?.company_id
    );

    if (!res.ok) {
      showToast({ title: 'Could not add card', description: res.error ?? undefined, tone: 'danger' });
      return;
    }

    setQuickDrafts((prev) => ({ ...prev, [columnName]: '' }));
    showToast({ title: `Added card to ${columnName}`, description: title, tone: 'success' });
    await reloadTasks();
  };

  const handleSaveTask = async (input: TaskInput) => {
    if (formState.mode === 'create') {
      const res = await createTask(input, workspace?.currentEmployee?.company_id);
      if (!res.ok) {
        showToast({ title: 'Failed to create task', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Task created', description: input.title, tone: 'success' });
    } else if (formState.task) {
      const res = await updateTask(formState.task.id, input);
      if (!res.ok) {
        showToast({ title: 'Failed to update task', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Task updated', description: input.title, tone: 'success' });
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
      showToast({ title: 'Task deleted', description: deleteTarget.title, tone: 'info' });
      await reloadTasks();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="kanban-page">
      <div role="status" className="visually-hidden">
        {statusAnnouncement}
      </div>

      <div className="kanban-toolbar">
        <div className="filter-bar" style={{ flex: 1 }}>
          <div className="search-wrap" style={{ maxInlineSize: '18rem' }}>
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search Kanban cards"
              className="field-input search-input"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter cards by priority"
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
            aria-label="Filter cards by assignee"
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
        </div>

        <div className="pill-cluster">
          <div className="segmented-control" role="group" aria-label="Kanban column set">
            <button
              type="button"
              className="segmented-btn"
              aria-pressed={columnMode === 'core'}
              onClick={() => setColumnMode('core')}
            >
              4 Core
            </button>
            <button
              type="button"
              className="segmented-btn"
              aria-pressed={columnMode === 'all'}
              onClick={() => setColumnMode('all')}
            >
              All 8 Statuses
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormState({ open: true, mode: 'create', task: null })}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div
          className="kanban-board"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(17.5rem, 1fr))`,
          }}
          role="status"
          aria-live="polite"
        >
          <span className="visually-hidden">Loading Kanban board...</span>
          {columns.map((column) => (
            <section key={column.name} className="kanban-column" aria-hidden="true">
              <header className="kanban-column-header">
                <h2 className="kanban-column-title">
                  <span className="badge-dot" style={{ backgroundColor: column.dotColor }} />
                  <span>{column.name}</span>
                </h2>
                <div className="skeleton-bar" style={{ inlineSize: '1.75rem', blockSize: '1.25rem' }} />
              </header>
              <div className="kanban-cards">
                {[0, 1, 2].map((cardIdx) => (
                  <div key={cardIdx} className="skeleton-kanban-card">
                    <div className="skeleton-bar" style={{ inlineSize: '45%', blockSize: '0.75rem' }} />
                    <div className="skeleton-bar" style={{ inlineSize: '90%', blockSize: '1rem' }} />
                    <div className="skeleton-bar" style={{ inlineSize: '65%', blockSize: '0.75rem' }} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div
          className="kanban-board"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(17.5rem, 1fr))`,
          }}
        >
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((task) => {
              if (columnMode === 'core' && column.name === 'In Progress') {
                return task.status === 'In Progress' || task.status === 'Active';
              }
              return task.status === column.name;
            });
            const isDropTarget = draggingTaskId !== null && dropColumn === column.name;

            return (
              <section
                key={column.name}
                data-kanban-column={column.name}
                className={`kanban-column ${isDropTarget ? 'kanban-column--drop-target' : ''}`}
                aria-label={`${column.name} column`}
              >
                <header className="kanban-column-header">
                  <h2 className="kanban-column-title">
                    <span
                      className="badge-dot"
                      style={{ backgroundColor: column.dotColor }}
                      aria-hidden="true"
                    />
                    <span>{column.name}</span>
                  </h2>
                  <span className="badge badge--neutral font-mono">{columnTasks.length}</span>
                </header>

                <div className="kanban-cards">
                  {columnTasks.map((task) => {
                    const isDragging = draggingTaskId === task.id;
                    const overdue = isTaskOverdue(task);
                    return (
                      <article
                        key={task.id}
                        className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
                        style={
                          isDragging
                            ? {
                                translate: `${dragOffset.x}px ${dragOffset.y}px`,
                                scale: '1.02',
                              }
                            : undefined
                        }
                      >
                        <div className="kanban-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className="kanban-drag-handle"
                              aria-label={`Drag ${task.title} to another column`}
                              onPointerDown={(e) => handleDragPointerDown(e, task)}
                              onPointerMove={handleDragPointerMove}
                              onPointerUp={(e) => void handleDragPointerUp(e)}
                              onPointerCancel={handleDragPointerCancel}
                              onLostPointerCapture={() => {
                                if (draggingTaskId === task.id) endDrag();
                              }}
                            >
                              <GripVertical size={15} aria-hidden="true" />
                            </button>
                            <span className="kanban-card-id font-mono">{task.task_code}</span>
                          </div>

                          <span className={getPriorityBadge(task.priority)}>
                            <span className="badge-dot" aria-hidden="true" />
                            <span>{task.priority}</span>
                          </span>
                        </div>

                        <h3 className="kanban-card-title">
                          <button
                            type="button"
                            className="task-title-btn"
                            onClick={() => setDetailTaskId(task.id)}
                          >
                            {task.title}
                          </button>
                        </h3>

                        <div className="kanban-card-footer">
                          <span
                            className={`kanban-due font-mono ${overdue ? 'badge badge--danger' : ''}`}
                          >
                            <Calendar size={13} aria-hidden="true" />
                            <span>{task.due_date || 'No due date'}</span>
                          </span>
                          <span
                            className="avatar-circle avatar-circle--sm"
                            title={task.assignee_name}
                            aria-label={`Assignee ${task.assignee_name}`}
                          >
                            {task.assignee_initials}
                          </span>
                        </div>

                        <div className="kanban-card-actions">
                          <span className="card-subtitle font-mono">{task.progress}%</span>
                          <select
                            aria-label={`Move ${task.title} to column`}
                            className="inline-select"
                            value={task.status}
                            onChange={(e) => void moveTaskToStatus(task.id, e.target.value)}
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <form
                  className="kanban-quick-add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleQuickAdd(column.name);
                  }}
                >
                  <label htmlFor={`quick-add-${column.name}`} className="visually-hidden">
                    Quick add card to {column.name}
                  </label>
                  <input
                    id={`quick-add-${column.name}`}
                    type="text"
                    className="field-input"
                    style={{ minBlockSize: '2.25rem', fontSize: '0.8125rem' }}
                    placeholder="+ Quick add task..."
                    value={quickDrafts[column.name] ?? ''}
                    onChange={(e) =>
                      setQuickDrafts((prev) => ({ ...prev, [column.name]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                        void handleQuickAdd(column.name);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    aria-label={`Add card to ${column.name}`}
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </form>
              </section>
            );
          })}
        </div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <div className="info-banner" role="status">
          <div className="info-banner-copy">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>No tasks match the active Kanban filters.</span>
          </div>
        </div>
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
        description="This action permanently deletes this task card from your workspace."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
