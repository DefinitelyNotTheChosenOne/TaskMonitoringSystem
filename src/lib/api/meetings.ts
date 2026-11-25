import { createClient } from '@/utils/supabase/client';
import {
  MeetingActionItem,
  MeetingInput,
  MeetingRecord,
} from '@/lib/types/workspace';
import { getTodayISO, toISODateOnly } from '@/lib/types/task';

function isMissingSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  return (
    code === '42703' ||
    code === '42P01' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find')
  );
}

export async function listMeetings(): Promise<{
  meetings: MeetingRecord[];
  schemaMissing: boolean;
  error: string | null;
}> {
  const supabase = createClient();

  const [
    { data: meetingRows, error: meetingErr },
    { data: actionRows, error: actionErr },
  ] = await Promise.all([
    supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('meeting_action_items')
      .select('*')
      .order('item_no')
      .order('created_at'),
  ]);

  if (isMissingSchemaError(meetingErr)) {
    return { meetings: [], schemaMissing: true, error: null };
  }
  if (meetingErr) {
    return { meetings: [], schemaMissing: false, error: meetingErr.message };
  }

  if (actionErr && !isMissingSchemaError(actionErr)) {
    return { meetings: [], schemaMissing: false, error: actionErr.message };
  }

  const actionsByMeeting = new Map<string, MeetingActionItem[]>();
  for (const raw of actionRows ?? []) {
    const item: MeetingActionItem = {
      id: String(raw.id),
      meeting_id: String(raw.meeting_id),
      company_id: raw.company_id ?? null,
      item_no: String(raw.item_no ?? '01'),
      action_item: String(raw.action_item ?? ''),
      person_responsible: String(raw.person_responsible ?? ''),
      assignee_id: raw.assignee_id ?? null,
      objective: String(raw.objective ?? ''),
      due_date: toISODateOnly(raw.due_date),
      status: String(raw.status ?? 'Not Started'),
      linked_task_id: raw.linked_task_id ?? null,
      created_at: String(raw.created_at ?? ''),
    };
    const list = actionsByMeeting.get(item.meeting_id) ?? [];
    list.push(item);
    actionsByMeeting.set(item.meeting_id, list);
  }

  const meetings: MeetingRecord[] = (meetingRows ?? []).map((row) => ({
    id: String(row.id),
    company_id: row.company_id ?? null,
    meeting_no: String(row.meeting_no ?? 'MTG-001'),
    title: String(row.title ?? 'Untitled Meeting'),
    objective: String(row.objective ?? ''),
    participants: String(row.participants ?? ''),
    organizer: String(row.organizer ?? ''),
    meeting_date: toISODateOnly(row.meeting_date),
    meeting_time: String(row.meeting_time ?? ''),
    location: String(row.location ?? ''),
    agenda: Array.isArray(row.agenda) ? row.agenda.map(String) : [],
    minutes: Array.isArray(row.minutes) ? row.minutes.map(String) : [],
    action_items: actionsByMeeting.get(String(row.id)) ?? [],
    created_at: String(row.created_at ?? ''),
  }));

  return { meetings, schemaMissing: false, error: null };
}

export async function createMeeting(
  input: MeetingInput,
  companyId?: string | null
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { error } = await supabase.from('meetings').insert({
    ...(companyId ? { company_id: companyId } : {}),
    meeting_no: input.meeting_no.trim() || `MTG-${Date.now().toString().slice(-4)}`,
    title: input.title.trim(),
    objective: input.objective.trim(),
    participants: input.participants.trim(),
    organizer: input.organizer.trim(),
    meeting_date: input.meeting_date || getTodayISO(),
    meeting_time: input.meeting_time.trim(),
    location: input.location.trim(),
    agenda: input.agenda,
    minutes: input.minutes,
    created_by: user?.id ?? null,
  });

  return { ok: !error, error: error?.message ?? null };
}

export async function updateMeeting(
  id: string,
  input: MeetingInput
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('meetings')
    .update({
      meeting_no: input.meeting_no.trim(),
      title: input.title.trim(),
      objective: input.objective.trim(),
      participants: input.participants.trim(),
      organizer: input.organizer.trim(),
      meeting_date: input.meeting_date || null,
      meeting_time: input.meeting_time.trim(),
      location: input.location.trim(),
      agenda: input.agenda,
      minutes: input.minutes,
    })
    .eq('id', id);

  return { ok: !error, error: error?.message ?? null };
}

export async function deleteMeeting(id: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function addMeetingActionItem(
  meetingId: string,
  item: {
    item_no: string;
    action_item: string;
    person_responsible: string;
    assignee_id: string | null;
    due_date: string;
    objective?: string;
  },
  companyId?: string | null
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('meeting_action_items').insert({
    meeting_id: meetingId,
    ...(companyId ? { company_id: companyId } : {}),
    item_no: item.item_no,
    action_item: item.action_item.trim(),
    person_responsible: item.person_responsible.trim(),
    assignee_id: item.assignee_id || null,
    objective: item.objective?.trim() ?? '',
    due_date: item.due_date || null,
    status: 'Not Started',
  });

  return { ok: !error, error: error?.message ?? null };
}

export async function updateMeetingActionItem(
  id: string,
  patch: Partial<{ status: string; linked_task_id: string | null }>
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('meeting_action_items')
    .update(patch)
    .eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function deleteMeetingActionItem(
  id: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('meeting_action_items').delete().eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function promoteActionItemToTask(
  actionItem: MeetingActionItem,
  meeting: Pick<MeetingRecord, 'meeting_no' | 'title'>,
  companyId?: string | null
): Promise<{ taskId: string | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const payload = {
    title: actionItem.action_item,
    description: actionItem.objective || `Action item from ${meeting.meeting_no}: ${meeting.title}`,
    status: actionItem.status || 'Not Started',
    priority: 'Medium',
    category: 'Meeting',
    department: 'Operations',
    assignee_id: actionItem.assignee_id || null,
    creator_id: user?.id ?? null,
    ...(companyId ? { company_id: companyId } : {}),
    due_date: actionItem.due_date ? `${actionItem.due_date}T00:00:00Z` : null,
    assigned_on: getTodayISO(),
    start_date: getTodayISO(),
    notes: `Promoted from meeting ${meeting.meeting_no} (${actionItem.person_responsible || 'Unassigned'})`,
  };

  const { data: createdTask, error: taskErr } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id')
    .single();

  if (taskErr || !createdTask) {
    return { taskId: null, error: taskErr?.message ?? 'Failed to create linked task' };
  }

  const { error: linkErr } = await supabase
    .from('meeting_action_items')
    .update({ linked_task_id: createdTask.id })
    .eq('id', actionItem.id);

  if (linkErr) {
    return { taskId: createdTask.id, error: linkErr.message };
  }

  return { taskId: createdTask.id, error: null };
}
