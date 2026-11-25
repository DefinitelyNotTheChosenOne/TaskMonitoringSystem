'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import MeetingFormModal from '@/components/meetings/MeetingFormModal';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';
import { MeetingActionItem, MeetingInput, MeetingRecord } from '@/lib/types/workspace';
import { TASK_STATUSES, WorkspaceContext } from '@/lib/types/task';
import { getWorkspaceContext } from '@/lib/api/tasks';
import {
  addMeetingActionItem,
  createMeeting,
  deleteMeeting,
  deleteMeetingActionItem,
  listMeetings,
  promoteActionItemToTask,
  updateMeeting,
  updateMeetingActionItem,
} from '@/lib/api/meetings';

interface ActionDraft {
  action_item: string;
  assignee_id: string;
  due_date: string;
}

export default function MeetingArchive() {
  const { showToast } = useToast();

  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDrafts, setActionDrafts] = useState<Record<string, ActionDraft>>({});

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    meeting: MeetingRecord | null;
  }>({ open: false, mode: 'create', meeting: null });
  const [deleteTarget, setDeleteTarget] = useState<MeetingRecord | null>(null);

  const reloadMeetings = useCallback(async () => {
    const [ctx, mtgRes] = await Promise.all([getWorkspaceContext(), listMeetings()]);
    setWorkspace(ctx);
    setSchemaMissing(mtgRes.schemaMissing);
    if (mtgRes.error) {
      showToast({ title: 'Could not load meetings', description: mtgRes.error, tone: 'danger' });
    } else {
      setMeetings(mtgRes.meetings);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    let active = true;
    async function init() {
      const [ctx, mtgRes] = await Promise.all([getWorkspaceContext(), listMeetings()]);
      if (!active) return;
      setWorkspace(ctx);
      setSchemaMissing(mtgRes.schemaMissing);
      if (mtgRes.error) {
        showToast({ title: 'Could not load meetings', description: mtgRes.error, tone: 'danger' });
      } else {
        setMeetings(mtgRes.meetings);
      }
      setLoading(false);
    }
    void init();
    return () => {
      active = false;
    };
  }, [showToast]);

  const employees = workspace?.employees ?? [];
  const companyId = workspace?.currentEmployee?.company_id ?? null;

  const filteredMeetings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter((m) =>
      `${m.meeting_no} ${m.title} ${m.objective} ${m.participants} ${m.organizer}`
        .toLowerCase()
        .includes(q)
    );
  }, [meetings, searchQuery]);

  const handleSaveMeeting = async (input: MeetingInput) => {
    if (formState.mode === 'create') {
      const res = await createMeeting(input, companyId);
      if (!res.ok) {
        showToast({ title: 'Could not create meeting', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Meeting saved', description: input.title, tone: 'success' });
    } else if (formState.meeting) {
      const res = await updateMeeting(formState.meeting.id, input);
      if (!res.ok) {
        showToast({ title: 'Could not update meeting', description: res.error ?? undefined, tone: 'danger' });
        return;
      }
      showToast({ title: 'Meeting updated', description: input.title, tone: 'success' });
    }
    setFormState({ open: false, mode: 'create', meeting: null });
    await reloadMeetings();
  };

  const handleConfirmDeleteMeeting = async () => {
    if (!deleteTarget) return;
    const res = await deleteMeeting(deleteTarget.id);
    if (!res.ok) {
      showToast({ title: 'Delete failed', description: res.error ?? undefined, tone: 'danger' });
    } else {
      showToast({ title: 'Meeting deleted', description: deleteTarget.title, tone: 'info' });
      await reloadMeetings();
    }
    setDeleteTarget(null);
  };

  const handleAddActionItem = async (meeting: MeetingRecord) => {
    const draft = actionDrafts[meeting.id] ?? { action_item: '', assignee_id: '', due_date: '' };
    if (!draft.action_item.trim()) return;

    const assignedEmp = employees.find((e) => e.id === draft.assignee_id);
    const nextItemNo = String(meeting.action_items.length + 1).padStart(2, '0');

    const res = await addMeetingActionItem(
      meeting.id,
      {
        item_no: nextItemNo,
        action_item: draft.action_item,
        person_responsible: assignedEmp?.name ?? '',
        assignee_id: draft.assignee_id || null,
        due_date: draft.due_date,
        objective: meeting.objective,
      },
      companyId
    );

    if (!res.ok) {
      showToast({ title: 'Could not add action item', description: res.error ?? undefined, tone: 'danger' });
      return;
    }

    setActionDrafts((prev) => ({
      ...prev,
      [meeting.id]: { action_item: '', assignee_id: '', due_date: '' },
    }));
    showToast({ title: 'Action item added', tone: 'success' });
    await reloadMeetings();
  };

  const handleActionStatusChange = async (item: MeetingActionItem, status: string) => {
    const res = await updateMeetingActionItem(item.id, { status });
    if (!res.ok) {
      showToast({ title: 'Could not update status', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    await reloadMeetings();
  };

  const handleDeleteActionItem = async (id: string) => {
    const res = await deleteMeetingActionItem(id);
    if (!res.ok) {
      showToast({ title: 'Failed to remove item', description: res.error ?? undefined, tone: 'danger' });
      return;
    }
    await reloadMeetings();
  };

  const handlePromoteToTask = async (item: MeetingActionItem, meeting: MeetingRecord) => {
    const res = await promoteActionItemToTask(item, meeting, companyId);
    if (res.error) {
      showToast({ title: 'Could not promote to Tasks Board', description: res.error, tone: 'danger' });
      return;
    }
    showToast({
      title: 'Listed on Tasks Board',
      description: `Created task for "${item.action_item}"`,
      tone: 'success',
    });
    await reloadMeetings();
  };

  return (
    <div className="meetings-page">
      {schemaMissing && (
        <div className="info-banner" role="status">
          <div className="info-banner-copy">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              Run <code>supabase_migration.sql</code> in Supabase SQL Editor to create the{' '}
              <code>meetings</code> and <code>meeting_action_items</code> tables.
            </span>
          </div>
        </div>
      )}

      <div className="tasks-toolbar no-print">
        <div className="search-wrap" style={{ maxInlineSize: '24rem' }}>
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search meeting archive"
            className="field-input search-input"
            placeholder="Search meetings, topics, or participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pill-cluster">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            disabled={filteredMeetings.length === 0}
          >
            <Printer size={16} aria-hidden="true" />
            <span>Print Minutes</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={schemaMissing}
            onClick={() => setFormState({ open: true, mode: 'create', meeting: null })}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-stack" role="status" aria-live="polite">
          <span className="visually-hidden">Loading meeting archive...</span>
          {[0, 1].map((idx) => (
            <div key={idx} className="surface-card form-stack" aria-hidden="true">
              <div className="skeleton-bar" style={{ inlineSize: '5.5rem', blockSize: '1.25rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '42%', blockSize: '1.5rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '85%', blockSize: '0.875rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '100%', blockSize: '3.5rem' }} />
            </div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <article className="surface-card empty-state-card">
          <h3>No meeting records yet</h3>
          <p className="section-subtitle">
            Log your first meeting to track agendas, minutes, and action items synced to the Tasks
            Board.
          </p>
        </article>
      ) : (
        filteredMeetings.map((meeting) => {
          const draft = actionDrafts[meeting.id] ?? {
            action_item: '',
            assignee_id: '',
            due_date: '',
          };

          return (
            <article key={meeting.id} className="surface-card meeting-card">
              <header className="meeting-card-head">
                <div>
                  <span className="badge badge--accent font-mono" style={{ marginBlockEnd: '0.5rem' }}>
                    {meeting.meeting_no}
                  </span>
                  <h2>{meeting.title}</h2>
                </div>

                <div className="pill-cluster">
                  {meeting.meeting_date && (
                    <span className="badge badge--neutral">
                      <Calendar size={13} aria-hidden="true" />
                      <span>{meeting.meeting_date}</span>
                    </span>
                  )}
                  {meeting.meeting_time && (
                    <span className="badge badge--neutral">
                      <Clock size={13} aria-hidden="true" />
                      <span>{meeting.meeting_time}</span>
                    </span>
                  )}
                  {meeting.location && (
                    <span className="badge badge--neutral">
                      <MapPin size={13} aria-hidden="true" />
                      <span>{meeting.location}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn-icon no-print"
                    aria-label={`Edit meeting ${meeting.title}`}
                    onClick={() => setFormState({ open: true, mode: 'edit', meeting })}
                  >
                    <Edit3 size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon no-print"
                    aria-label={`Delete meeting ${meeting.title}`}
                    onClick={() => setDeleteTarget(meeting)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="meeting-meta-grid">
                <div className="muted-well">
                  <dl className="meta-dl">
                    <div className="meta-dl-row">
                      <dt>Objective</dt>
                      <dd>{meeting.objective || '—'}</dd>
                    </div>
                    <div className="meta-dl-row">
                      <dt>Organizer</dt>
                      <dd>{meeting.organizer || '—'}</dd>
                    </div>
                    <div className="meta-dl-row">
                      <dt>Participants</dt>
                      <dd>{meeting.participants || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="muted-well">
                  <h3 className="card-title" style={{ marginBlockEnd: '0.625rem' }}>
                    Agenda
                  </h3>
                  {meeting.agenda.length === 0 ? (
                    <p className="card-subtitle">No agenda items listed.</p>
                  ) : (
                    <ul className="agenda-list">
                      {meeting.agenda.map((ag, idx) => (
                        <li key={idx} className="agenda-item">
                          {ag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <section>
                <h3 className="card-title" style={{ marginBlockEnd: '0.625rem' }}>
                  Minutes of the Meeting
                </h3>
                {meeting.minutes.length === 0 ? (
                  <p className="card-subtitle">No minutes recorded.</p>
                ) : (
                  <ul className="bullet-list">
                    {meeting.minutes.map((min, idx) => (
                      <li key={idx}>{min}</li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="card-title" style={{ marginBlockEnd: '0.625rem' }}>
                  Action Items ({meeting.action_items.length})
                </h3>

                <div className="table-region" tabIndex={0} role="region" aria-label={`${meeting.title} action items`}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">No.</th>
                        <th scope="col">Action Item</th>
                        <th scope="col">Responsible</th>
                        <th scope="col">Due Date</th>
                        <th scope="col">Status</th>
                        <th scope="col">Tasks Board</th>
                        <th scope="col" className="cell-align-end no-print">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meeting.action_items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="table-empty-cell">
                            No action items logged yet. Add one below.
                          </td>
                        </tr>
                      ) : (
                        meeting.action_items.map((item) => (
                          <tr key={item.id} className="data-table-row">
                            <td className="font-mono text-secondary">{item.item_no}</td>
                            <th scope="row" className="table-row-header">
                              {item.action_item}
                            </th>
                            <td>{item.person_responsible || 'Unassigned'}</td>
                            <td className="font-mono">{item.due_date || '—'}</td>
                            <td>
                              <select
                                aria-label={`Status for ${item.action_item}`}
                                className="inline-select"
                                value={item.status}
                                onChange={(e) => void handleActionStatusChange(item, e.target.value)}
                              >
                                {TASK_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              {item.linked_task_id ? (
                                <Link href="/tasks" className="badge badge--success" style={{ textDecoration: 'none' }}>
                                  <CheckCircle2 size={13} aria-hidden="true" />
                                  <span>Listed on Tasks Board</span>
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm no-print"
                                  onClick={() => void handlePromoteToTask(item, meeting)}
                                >
                                  <ArrowUpRight size={14} aria-hidden="true" />
                                  <span>Send to Tasks Board</span>
                                </button>
                              )}
                            </td>
                            <td className="cell-align-end no-print">
                              <button
                                type="button"
                                className="btn-icon"
                                aria-label={`Delete action item ${item.action_item}`}
                                onClick={() => void handleDeleteActionItem(item.id)}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Inline Add Action Item Form */}
                <form
                  className="filter-bar no-print"
                  style={{ marginBlockStart: '0.875rem' }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleAddActionItem(meeting);
                  }}
                >
                  <input
                    type="text"
                    aria-label={`New action item for ${meeting.title}`}
                    className="field-input"
                    style={{ flex: '1 1 16rem', minBlockSize: '2.375rem' }}
                    placeholder="Add follow-up action item..."
                    value={draft.action_item}
                    onChange={(e) =>
                      setActionDrafts((prev) => ({
                        ...prev,
                        [meeting.id]: { ...draft, action_item: e.target.value },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                        void handleAddActionItem(meeting);
                      }
                    }}
                  />

                  <select
                    aria-label="Person responsible"
                    className="field-select field-select--compact"
                    value={draft.assignee_id}
                    onChange={(e) =>
                      setActionDrafts((prev) => ({
                        ...prev,
                        [meeting.id]: { ...draft, assignee_id: e.target.value },
                      }))
                    }
                  >
                    <option value="">Assign person...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    aria-label="Action item due date"
                    className="field-input font-mono"
                    style={{ inlineSize: 'auto', minBlockSize: '2.375rem' }}
                    value={draft.due_date}
                    onChange={(e) =>
                      setActionDrafts((prev) => ({
                        ...prev,
                        [meeting.id]: { ...draft, due_date: e.target.value },
                      }))
                    }
                  />

                  <button type="submit" className="btn btn-secondary btn-sm">
                    <Plus size={14} aria-hidden="true" />
                    <span>Add Action</span>
                  </button>
                </form>
              </section>
            </article>
          );
        })
      )}

      <MeetingFormModal
        key={`${formState.mode}-${formState.meeting?.id ?? 'new'}-${formState.open ? '1' : '0'}`}
        open={formState.open}
        mode={formState.mode}
        initialMeeting={formState.meeting}
        onClose={() => setFormState({ open: false, mode: 'create', meeting: null })}
        onSubmit={handleSaveMeeting}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete meeting "${deleteTarget?.title ?? ''}"?`}
        description="This permanently removes the meeting record and its action items."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteMeeting}
      />
    </div>
  );
}
