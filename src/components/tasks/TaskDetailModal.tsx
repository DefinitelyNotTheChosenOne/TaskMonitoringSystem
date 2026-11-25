'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Download,
  Edit3,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import {
  TaskAttachment,
  TaskComment,
  TaskRecord,
  TaskSubtask,
  computeDaysLeft,
  isTaskOverdue,
} from '@/lib/types/task';
import {
  addTaskComment,
  addTaskSubtask,
  deleteTaskSubtask,
  getAttachmentSignedUrl,
  listTaskComments,
  listTaskSubtasks,
  removeTaskAttachment,
  toggleTaskSubtask,
  updateTask,
  uploadTaskAttachment,
} from '@/lib/api/tasks';
import { useToast } from '@/components/ui/ToastProvider';

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TaskDetailModalProps {
  task: TaskRecord | null;
  companyId?: string | null;
  currentUser: { id?: string | null; name: string };
  onClose: () => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (task: TaskRecord) => void;
  onTaskUpdated: () => Promise<void>;
}

export default function TaskDetailModal({
  task,
  companyId,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachmentOverrides, setAttachmentOverrides] = useState<
    Record<string, TaskAttachment[]>
  >({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [removingPath, setRemovingPath] = useState<string | null>(null);

  const subtaskFormRef = useRef<HTMLFormElement>(null);
  const commentFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!task) return;
    let active = true;
    async function loadDetails(taskId: string) {
      const [subRes, comRes] = await Promise.all([
        listTaskSubtasks(taskId),
        listTaskComments(taskId),
      ]);
      if (!active) return;
      setSubtasks(subRes.subtasks);
      setComments(comRes.comments);
      setSchemaMissing(subRes.schemaMissing || comRes.schemaMissing);
    }
    void loadDetails(task.id);
    return () => {
      active = false;
    };
  }, [task]);

  if (!task) {
    return (
      <ModalDialog open={false} onClose={onClose} title="Task Details" size="lg">
        <div />
      </ModalDialog>
    );
  }

  const daysLeft = computeDaysLeft(task.due_date);
  const overdue = isTaskOverdue(task);
  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const attachments = attachmentOverrides[task.id] ?? task.attachments ?? [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingFile(true);
    const res = await uploadTaskAttachment(task.id, file, attachments);
    setUploadingFile(false);

    if (res.error || !res.attachment) {
      showToast({
        title: 'Attachment upload failed',
        description: res.error ?? 'Ensure supabase_migration.sql has been run for task-attachments storage.',
        tone: 'danger',
      });
      return;
    }

    const nextList = [...attachments, res.attachment];
    setAttachmentOverrides((prev) => ({ ...prev, [task.id]: nextList }));
    await onTaskUpdated();
    showToast({ title: `Uploaded "${file.name}"`, tone: 'success' });
  };

  const handleOpenAttachment = async (att: TaskAttachment) => {
    setOpeningPath(att.path);
    const res = await getAttachmentSignedUrl(att.path);
    setOpeningPath(null);
    if (res.error || !res.url) {
      showToast({
        title: 'Could not open attachment',
        description: res.error ?? 'Failed to generate download link.',
        tone: 'danger',
      });
      return;
    }
    window.open(res.url, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveAttachment = async (att: TaskAttachment) => {
    setRemovingPath(att.path);
    const res = await removeTaskAttachment(task.id, att, attachments);
    setRemovingPath(null);
    if (!res.ok) {
      showToast({
        title: 'Could not remove attachment',
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }
    const nextList = attachments.filter((a) => a.path !== att.path);
    setAttachmentOverrides((prev) => ({ ...prev, [task.id]: nextList }));
    await onTaskUpdated();
    showToast({ title: `Removed "${att.name}"`, tone: 'info' });
  };

  const handleAddSubtask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubmittingSubtask(true);
    const res = await addTaskSubtask(task.id, newSubtask, companyId);
    setSubmittingSubtask(false);
    if (res.error) {
      showToast({ title: 'Could not add checklist item', description: res.error, tone: 'danger' });
      return;
    }
    if (res.subtask) {
      const nextList = [...subtasks, res.subtask];
      setSubtasks(nextList);
      setNewSubtask('');
      const pct = Math.round(
        (nextList.filter((s) => s.is_completed).length / nextList.length) * 100
      );
      await updateTask(task.id, { progress: pct });
      await onTaskUpdated();
    }
  };

  const handleToggleSubtask = async (item: TaskSubtask, checked: boolean) => {
    const nextList = subtasks.map((s) =>
      s.id === item.id ? { ...s, is_completed: checked } : s
    );
    setSubtasks(nextList);
    const res = await toggleTaskSubtask(item.id, checked);
    if (!res.ok) {
      setSubtasks(subtasks);
      showToast({ title: 'Failed to update subtask', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    if (nextList.length > 0 && task.status !== 'Completed') {
      const pct = Math.round(
        (nextList.filter((s) => s.is_completed).length / nextList.length) * 100
      );
      await updateTask(task.id, { progress: pct });
      await onTaskUpdated();
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    const prev = subtasks;
    const nextList = subtasks.filter((s) => s.id !== id);
    setSubtasks(nextList);
    const res = await deleteTaskSubtask(id);
    if (!res.ok) {
      setSubtasks(prev);
      showToast({ title: 'Failed to remove subtask', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    if (nextList.length > 0 && task.status !== 'Completed') {
      const pct = Math.round(
        (nextList.filter((s) => s.is_completed).length / nextList.length) * 100
      );
      await updateTask(task.id, { progress: pct });
      await onTaskUpdated();
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    const res = await addTaskComment(task.id, newComment, currentUser, companyId);
    setSubmittingComment(false);
    if (res.error) {
      showToast({ title: 'Could not post comment', description: res.error, tone: 'danger' });
      return;
    }
    if (res.comment) {
      setComments((prev) => [...prev, res.comment!]);
      setNewComment('');
    }
  };

  return (
    <ModalDialog
      open={Boolean(task)}
      onClose={onClose}
      title={task.title}
      subtitle={`${task.task_code} · ${task.department} · ${task.category}`}
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onDelete(task)}
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Delete</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEdit(task)}
          >
            <Edit3 size={15} aria-hidden="true" />
            <span>Edit Task</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="detail-stack">
        <div className="pill-cluster">
          <span className="badge badge--info">{task.status}</span>
          <span className="badge badge--warning">{task.priority}</span>
          <span className="badge badge--accent">{task.category}</span>
          <span className="badge badge--neutral">{task.remarks}</span>
          {overdue && <span className="badge badge--danger">Overdue</span>}
        </div>

        <div className="detail-meta-grid">
          <div className="muted-well">
            <div className="tasks-summary-label">Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={15} aria-hidden="true" />
              <strong>{task.assignee_name}</strong>
            </div>
          </div>

          <div className="muted-well">
            <div className="tasks-summary-label">Schedule</div>
            <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
              <Calendar size={15} aria-hidden="true" />
              <span>{task.due_date || 'No due date'}</span>
            </div>
            {daysLeft !== null && (
              <span className="card-subtitle font-mono">
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
              </span>
            )}
          </div>

          <div className="muted-well">
            <div className="tasks-summary-label">Progress</div>
            <div className="meter-row-head" style={{ marginBlockEnd: '0.25rem' }}>
              <strong className="font-mono">{task.progress}%</strong>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ inlineSize: `${task.progress}%` }} />
            </div>
          </div>
        </div>

        {task.description && (
          <section className="detail-section">
            <h3>Description</h3>
            <p className="card-subtitle">{task.description}</p>
          </section>
        )}

        {task.notes && (
          <section className="detail-section">
            <h3>Notes</h3>
            <p className="muted-well card-subtitle">{task.notes}</p>
          </section>
        )}

        {/* File Attachments */}
        <section className="detail-section" aria-labelledby="attachments-heading">
          <div className="detail-section-head">
            <h3
              id="attachments-heading"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Paperclip size={16} aria-hidden="true" />
              <span>Attachments ({attachments.length})</span>
            </h3>
            <div>
              <label htmlFor="task-attachment-upload" className="visually-hidden">
                Upload task attachment
              </label>
              <input
                id="task-attachment-upload"
                ref={fileInputRef}
                type="file"
                className="visually-hidden"
                disabled={uploadingFile}
                onChange={(e) => void handleFileUpload(e)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={14} aria-hidden="true" />
                <span>{uploadingFile ? 'Uploading...' : 'Attach File'}</span>
              </button>
            </div>
          </div>

          {attachments.length === 0 ? (
            <p className="card-subtitle">No files attached to this task yet.</p>
          ) : (
            <div className="attachment-list">
              {attachments.map((att) => (
                <div key={att.path} className="attachment-row">
                  <div className="attachment-meta">
                    <span className="attachment-name">{att.name}</span>
                    <span className="text-secondary font-mono" style={{ fontSize: '0.75rem' }}>
                      {formatFileSize(att.size)} · {att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString() : 'Uploaded'}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={openingPath === att.path}
                      onClick={() => void handleOpenAttachment(att)}
                    >
                      <Download size={14} aria-hidden="true" />
                      <span>{openingPath === att.path ? 'Opening...' : 'Open'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      disabled={removingPath === att.path}
                      onClick={() => void handleRemoveAttachment(att)}
                      aria-label={`Remove ${att.name}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {schemaMissing && (
          <div className="info-banner">
            <span>
              Run <code>supabase_migration.sql</code> in Supabase SQL Editor to enable persistent
              subtasks checklists and comment threads.
            </span>
          </div>
        )}

        {/* Subtasks Checklist */}
        <section className="detail-section" aria-labelledby="subtasks-heading">
          <div className="detail-section-head">
            <h3 id="subtasks-heading">
              Checklist ({completedSubtasks}/{subtasks.length})
            </h3>
          </div>

          <ul className="subtask-list">
            {subtasks.map((sub) => (
              <li key={sub.id} className="subtask-row">
                <label className="subtask-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={sub.is_completed}
                    onChange={(e) => void handleToggleSubtask(sub, e.target.checked)}
                  />
                  <span className="subtask-text">{sub.title}</span>
                </label>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Delete checklist item ${sub.title}`}
                  onClick={() => void handleDeleteSubtask(sub.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <form
            ref={subtaskFormRef}
            className="inline-add-form"
            onSubmit={handleAddSubtask}
          >
            <label htmlFor="new-subtask-input" className="visually-hidden">
              Add checklist item
            </label>
            <input
              id="new-subtask-input"
              type="text"
              className="field-input"
              placeholder="Add checklist item..."
              disabled={schemaMissing || submittingSubtask}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  subtaskFormRef.current?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={schemaMissing || submittingSubtask}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>
        </section>

        {/* Comments Thread */}
        <section className="detail-section" aria-labelledby="comments-heading">
          <div className="detail-section-head">
            <h3 id="comments-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} aria-hidden="true" />
              <span>Activity & Comments ({comments.length})</span>
            </h3>
          </div>

          {comments.length > 0 && (
            <div className="comment-list">
              {comments.map((c) => (
                <article key={c.id} className="comment-card">
                  <div className="comment-head">
                    <strong>{c.author_name}</strong>
                    <span className="text-secondary font-mono">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p>{c.body}</p>
                </article>
              ))}
            </div>
          )}

          <form ref={commentFormRef} className="form-stack" onSubmit={handleAddComment}>
            <div className="field">
              <label htmlFor="new-comment-input" className="field-label">
                Add Comment (Enter to post, Shift+Enter for new line)
              </label>
              <textarea
                id="new-comment-input"
                className="field-textarea"
                placeholder="Share a status update or question..."
                disabled={schemaMissing || submittingComment}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    commentFormRef.current?.requestSubmit();
                  }
                }}
              />
            </div>
            <div className="form-actions-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={schemaMissing || submittingComment}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </ModalDialog>
  );
}
