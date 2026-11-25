'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import {
  EmployeeProfile,
  TASK_PRIORITIES,
  TASK_REMARKS,
  TASK_STATUSES,
  TaskInput,
  TaskRecord,
  getTodayISO,
} from '@/lib/types/task';

interface TaskFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialTask?: TaskRecord | null;
  employees: EmployeeProfile[];
  categories: string[];
  departments: string[];
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}

export default function TaskFormModal({
  open,
  mode,
  initialTask,
  employees,
  categories,
  departments,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const isEdit = mode === 'edit' && Boolean(initialTask);
  const today = getTodayISO();

  const [title, setTitle] = useState(isEdit && initialTask ? initialTask.title : '');
  const [description, setDescription] = useState(
    isEdit && initialTask ? initialTask.description : ''
  );
  const [assigneeId, setAssigneeId] = useState(
    isEdit && initialTask ? initialTask.assignee_id ?? '' : ''
  );
  const [category, setCategory] = useState(
    isEdit && initialTask
      ? initialTask.category || categories[0] || 'Project'
      : categories[0] ?? 'Project'
  );
  const [department, setDepartment] = useState(
    isEdit && initialTask
      ? initialTask.department || departments[0] || 'Operations'
      : departments[0] ?? 'Operations'
  );
  const [priority, setPriority] = useState(
    isEdit && initialTask ? initialTask.priority || 'Medium' : 'Medium'
  );
  const [status, setStatus] = useState(
    isEdit && initialTask ? initialTask.status || 'Not Started' : 'Not Started'
  );
  const [remarks, setRemarks] = useState(
    isEdit && initialTask ? initialTask.remarks || 'Open' : 'Open'
  );
  const [startDate, setStartDate] = useState(
    isEdit && initialTask
      ? initialTask.start_date || initialTask.assigned_on || today
      : today
  );
  const [dueDate, setDueDate] = useState(
    isEdit && initialTask ? initialTask.due_date || '' : ''
  );
  const [progress, setProgress] = useState(
    isEdit && initialTask ? initialTask.progress ?? 0 : 0
  );
  const [notes, setNotes] = useState(
    isEdit && initialTask ? initialTask.notes || '' : ''
  );
  const [saving, setSaving] = useState(false);

  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.style.setProperty('--attr-min', el.min || '0');
    el.style.setProperty('--attr-max', el.max || '100');
    el.style.setProperty('--control-value', String(progress));
  }, [progress, open]);

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus);
    if (nextStatus === 'Completed') {
      setProgress(100);
      setRemarks('Closed');
    } else if (remarks === 'Closed') {
      setRemarks('Open');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        assignee_id: assigneeId || null,
        category,
        department,
        priority,
        status,
        remarks,
        start_date: startDate || null,
        due_date: dueDate || null,
        assigned_on: initialTask?.assigned_on || getTodayISO(),
        progress,
        notes,
      });
    } finally {
      setSaving(false);
    }
  };

  const formId = 'task-upsert-form';

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Task' : `Edit Task (${initialTask?.task_code ?? ''})`}
      subtitle="Fill out task scheduling, ownership, and tracking metadata."
      size="lg"
      autoFocusClose={false}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id={formId} className="form-stack" onSubmit={handleSubmit}>
        <p className="form-hint">Fields marked * are required.</p>

        <div className="field">
          <label htmlFor="task-title-input" className="field-label">
            Task Title<span className="field-required" aria-hidden="true">*</span>
          </label>
          <input
            id="task-title-input"
            type="text"
            required
            autoFocus
            data-error="task-title-error"
            className="field-input"
            placeholder="e.g. Finalize Q4 budget review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div id="task-title-error" className="error-msg">
            <AlertCircle size={14} aria-hidden="true" />
            <span>Task title is required.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="task-desc-input" className="field-label">
            Task Description
          </label>
          <textarea
            id="task-desc-input"
            className="field-textarea"
            placeholder="Describe deliverables, context, or acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-grid--2">
          <div className="field">
            <label htmlFor="task-assignee-select" className="field-label">
              Person Assigned
            </label>
            <select
              id="task-assignee-select"
              className="field-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                  {emp.department ? ` (${emp.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-status-select" className="field-label">
              Status
            </label>
            <select
              id="task-status-select"
              className="field-select"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-priority-select" className="field-label">
              Priority
            </label>
            <select
              id="task-priority-select"
              className="field-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-category-select" className="field-label">
              Category
            </label>
            <select
              id="task-category-select"
              className="field-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-department-select" className="field-label">
              Department
            </label>
            <select
              id="task-department-select"
              className="field-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-remarks-select" className="field-label">
              Remarks
            </label>
            <select
              id="task-remarks-select"
              className="field-select"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            >
              {TASK_REMARKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-start-date" className="field-label">
              Start Date
            </label>
            <input
              id="task-start-date"
              type="date"
              className="field-input font-mono"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="task-due-date" className="field-label">
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              className="field-input font-mono"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <div className="meter-row-head">
            <label htmlFor="task-progress-range" className="field-label">
              Completion Progress
            </label>
            <span className="font-mono badge badge--accent">{progress}%</span>
          </div>
          <input
            ref={sliderRef}
            id="task-progress-range"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            aria-valuetext={`${progress} percent`}
            className="range-slider"
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        </div>

        <div className="field">
          <label htmlFor="task-notes-input" className="field-label">
            Notes
          </label>
          <textarea
            id="task-notes-input"
            className="field-textarea"
            placeholder="Optional review notes or links..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </ModalDialog>
  );
}
