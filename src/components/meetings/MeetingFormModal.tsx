'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import { MeetingInput, MeetingRecord } from '@/lib/types/workspace';
import { getTodayISO } from '@/lib/types/task';

interface MeetingFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialMeeting?: MeetingRecord | null;
  onClose: () => void;
  onSubmit: (input: MeetingInput) => Promise<void>;
}

export default function MeetingFormModal({
  open,
  mode,
  initialMeeting,
  onClose,
  onSubmit,
}: MeetingFormModalProps) {
  const isEdit = mode === 'edit' && Boolean(initialMeeting);

  const [meetingNo, setMeetingNo] = useState(
    isEdit && initialMeeting ? initialMeeting.meeting_no : `MTG-${new Date().getFullYear()}-001`
  );
  const [title, setTitle] = useState(isEdit && initialMeeting ? initialMeeting.title : '');
  const [objective, setObjective] = useState(
    isEdit && initialMeeting ? initialMeeting.objective : ''
  );
  const [organizer, setOrganizer] = useState(
    isEdit && initialMeeting ? initialMeeting.organizer : ''
  );
  const [participants, setParticipants] = useState(
    isEdit && initialMeeting ? initialMeeting.participants : ''
  );
  const [meetingDate, setMeetingDate] = useState(
    isEdit && initialMeeting ? initialMeeting.meeting_date || getTodayISO() : getTodayISO()
  );
  const [meetingTime, setMeetingTime] = useState(
    isEdit && initialMeeting ? initialMeeting.meeting_time : '10:00 AM - 11:00 AM'
  );
  const [location, setLocation] = useState(
    isEdit && initialMeeting ? initialMeeting.location : ''
  );
  const [agendaText, setAgendaText] = useState(
    isEdit && initialMeeting ? initialMeeting.agenda.join('\n') : ''
  );
  const [minutesText, setMinutesText] = useState(
    isEdit && initialMeeting ? initialMeeting.minutes.join('\n') : ''
  );
  const [saving, setSaving] = useState(false);

  const formId = 'meeting-upsert-form';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        meeting_no: meetingNo,
        title,
        objective,
        organizer,
        participants,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        location,
        agenda: agendaText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        minutes: minutesText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Log New Meeting' : `Edit Meeting (${initialMeeting?.meeting_no ?? ''})`}
      subtitle="Record meeting metadata, agenda items, and minutes."
      size="lg"
      autoFocusClose={false}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : mode === 'create' ? 'Create Meeting' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id={formId} className="form-stack" onSubmit={handleSubmit}>
        <p className="form-hint">Fields marked * are required.</p>

        <div className="form-grid--2">
          <div className="field">
            <label htmlFor="mtg-title" className="field-label">
              Meeting Title<span className="field-required" aria-hidden="true">*</span>
            </label>
            <input
              id="mtg-title"
              type="text"
              required
              autoFocus
              data-error="mtg-title-error"
              className="field-input"
              placeholder="e.g. Q4 Sprint Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div id="mtg-title-error" className="error-msg">
              <AlertCircle size={14} aria-hidden="true" />
              <span>Meeting title is required.</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="mtg-no" className="field-label">
              Meeting No.
            </label>
            <input
              id="mtg-no"
              type="text"
              className="field-input font-mono"
              value={meetingNo}
              onChange={(e) => setMeetingNo(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mtg-date" className="field-label">
              Date
            </label>
            <input
              id="mtg-date"
              type="date"
              className="field-input font-mono"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mtg-time" className="field-label">
              Time
            </label>
            <input
              id="mtg-time"
              type="text"
              className="field-input"
              placeholder="10:00 AM - 11:00 AM"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mtg-organizer" className="field-label">
              Organizer
            </label>
            <input
              id="mtg-organizer"
              type="text"
              className="field-input"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mtg-location" className="field-label">
              Location / Link
            </label>
            <input
              id="mtg-location"
              type="text"
              className="field-input"
              placeholder="Conference Room A / Zoom"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="mtg-objective" className="field-label">
            Objective
          </label>
          <input
            id="mtg-objective"
            type="text"
            className="field-input"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="mtg-participants" className="field-label">
            Participants
          </label>
          <input
            id="mtg-participants"
            type="text"
            className="field-input"
            placeholder="Comma-separated attendee names"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          />
        </div>

        <div className="form-grid--2">
          <div className="field">
            <label htmlFor="mtg-agenda" className="field-label">
              Agenda (one item per line)
            </label>
            <textarea
              id="mtg-agenda"
              className="field-textarea"
              placeholder={'1. Status Review\n2. Blockers\n3. Next Steps'}
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="mtg-minutes" className="field-label">
              Minutes (one point per line)
            </label>
            <textarea
              id="mtg-minutes"
              className="field-textarea"
              placeholder={'Reviewed Q3 metrics.\nAssigned follow-up tasks.'}
              value={minutesText}
              onChange={(e) => setMinutesText(e.target.value)}
            />
          </div>
        </div>
      </form>
    </ModalDialog>
  );
}
