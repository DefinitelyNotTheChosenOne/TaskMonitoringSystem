import { createClient } from '@/utils/supabase/client';
import { createUserNotification } from '@/lib/api/notifications';
import {
  CompanyProfile,
  DEFAULT_CATEGORIES,
  DEFAULT_DEPARTMENTS,
  EmployeeProfile,
  TaskAttachment,
  TaskComment,
  TaskInput,
  TaskRecord,
  TaskSubtask,
  WorkspaceContext,
  computeDashboardAnalytics,
  normalizeTaskRow,
} from '@/lib/types/task';

const DEFAULT_COMPANY: CompanyProfile = {
  id: 'default',
  name: 'JRPCo Prime',
  tagline: 'Team Task Management Workspace',
  mission:
    'Deliver high-quality, innovative solutions that empower teams to collaborate efficiently and stay organized every single day.',
};

function isMissingSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  return (
    code === '42703' ||
    code === '42P01' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('column') ||
    msg.includes('does not exist') ||
    msg.includes('could not find')
  );
}

let workspaceContextCache: { value: WorkspaceContext; expiresAt: number } | null = null;
let workspaceContextInFlight: Promise<WorkspaceContext> | null = null;
const WORKSPACE_CACHE_TTL_MS = 30_000;

export function invalidateWorkspaceContextCache(): void {
  workspaceContextCache = null;
  workspaceContextInFlight = null;
}

async function fetchWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = createClient();

  const [
    {
      data: { session },
    },
    { data: empRows },
    { data: optionRows, error: optionsError },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from('employees')
      .select('id, company_id, role, name, email, emp_id, department, position')
      .order('name'),
    supabase
      .from('workspace_options')
      .select('option_type, label, sort_order')
      .order('sort_order'),
  ]);

  const userId = session?.user?.id ?? null;

  const employees: EmployeeProfile[] = (empRows ?? []).map((row) => ({
    id: String(row.id),
    company_id: row.company_id ?? null,
    role: row.role ?? 'employee',
    name: row.name ?? 'Team Member',
    email: row.email ?? null,
    emp_id: row.emp_id ?? null,
    department: row.department ?? null,
    position: row.position ?? null,
  }));

  const currentEmployee = userId
    ? employees.find((e) => e.id === userId) ?? null
    : null;

  let company = DEFAULT_COMPANY;
  let schemaReady = !isMissingSchemaError(optionsError);

  if (currentEmployee?.company_id) {
    const { data: compRow, error: compError } = await supabase
      .from('companies')
      .select('id, name, tagline, mission, logo_url')
      .eq('id', currentEmployee.company_id)
      .maybeSingle();

    if (isMissingSchemaError(compError)) {
      schemaReady = false;
    } else if (compRow) {
      company = {
        id: String(compRow.id),
        name: compRow.name ?? DEFAULT_COMPANY.name,
        tagline: compRow.tagline ?? DEFAULT_COMPANY.tagline,
        mission: compRow.mission ?? DEFAULT_COMPANY.mission,
        logo_url: compRow.logo_url ?? null,
      };
    }
  }

  let categories: string[] = [...DEFAULT_CATEGORIES];
  let departments: string[] = [...DEFAULT_DEPARTMENTS];

  if (optionRows && optionRows.length > 0) {
    const customCats = optionRows
      .filter((o) => o.option_type === 'category' && o.label)
      .map((o) => String(o.label));
    const customDepts = optionRows
      .filter((o) => o.option_type === 'department' && o.label)
      .map((o) => String(o.label));
    if (customCats.length > 0) categories = customCats;
    if (customDepts.length > 0) departments = customDepts;
  }

  return {
    userId,
    currentEmployee,
    company,
    employees,
    categories,
    departments,
    schemaReady,
  };
}

export async function getWorkspaceContext(forceRefresh = false): Promise<WorkspaceContext> {
  if (!forceRefresh && workspaceContextCache && Date.now() < workspaceContextCache.expiresAt) {
    return workspaceContextCache.value;
  }
  if (!forceRefresh && workspaceContextInFlight) {
    return workspaceContextInFlight;
  }

  const pending = fetchWorkspaceContext().then((value) => {
    workspaceContextCache = {
      value,
      expiresAt: Date.now() + WORKSPACE_CACHE_TTL_MS,
    };
    return value;
  });

  workspaceContextInFlight = pending;
  try {
    return await pending;
  } finally {
    if (workspaceContextInFlight === pending) {
      workspaceContextInFlight = null;
    }
  }
}

export async function listTasks(
  employees?: EmployeeProfile[]
): Promise<{ tasks: TaskRecord[]; error: string | null }> {
  const supabase = createClient();

  let empList = employees;
  if (!empList) {
    const { data: empRows } = await supabase
      .from('employees')
      .select('id, company_id, role, name, email, emp_id, department, position');
    empList = (empRows ?? []).map((row) => ({
      id: String(row.id),
      company_id: row.company_id ?? null,
      role: row.role ?? 'employee',
      name: row.name ?? 'Team Member',
      email: row.email ?? null,
      emp_id: row.emp_id ?? null,
      department: row.department ?? null,
      position: row.position ?? null,
    }));
  }

  const employeeMap = new Map<string, EmployeeProfile>(empList.map((e) => [e.id, e]));

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { tasks: [], error: error.message };
  }

  const tasks = (data ?? []).map((row, idx) =>
    normalizeTaskRow(row as Record<string, unknown>, employeeMap, idx)
  );

  return { tasks, error: null };
}

export async function getDashboardStats(month = 'November', year = '2026') {
  const supabase = createClient();
  const [context, { data: taskRows, error: taskError }] = await Promise.all([
    getWorkspaceContext(),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
  ]);

  if (taskError) {
    const error = taskError.message;
    console.warn('Error fetching tasks for stats:', error);
    const emptyAnalytics = computeDashboardAnalytics(
      [],
      month,
      year,
      context.userId,
      context.categories,
      context.departments
    );
    return {
      ...context,
      tasks: [],
      analytics: emptyAnalytics,
      priorityData: emptyAnalytics.priorityData,
      statusData: emptyAnalytics.statusData,
      loadError: error,
    };
  }

  const employeeMap = new Map<string, EmployeeProfile>(
    context.employees.map((e) => [e.id, e])
  );
  const tasks = (taskRows ?? []).map((row, idx) =>
    normalizeTaskRow(row as Record<string, unknown>, employeeMap, idx)
  );

  const analytics = computeDashboardAnalytics(
    tasks,
    month,
    year,
    context.userId,
    context.categories,
    context.departments
  );

  return {
    ...context,
    tasks,
    analytics,
    priorityData: analytics.priorityData,
    statusData: analytics.statusData,
    loadError: null as string | null,
  };
}

function buildRichPayload(input: TaskInput, companyId?: string | null, userId?: string | null) {
  const isCompleted = input.status === 'Completed';
  return {
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    status: input.status,
    priority: input.priority,
    assignee_id: input.assignee_id || null,
    due_date: input.due_date ? `${input.due_date}T00:00:00Z` : null,
    ...(companyId ? { company_id: companyId } : {}),
    ...(userId ? { creator_id: userId } : {}),
    category: input.category || 'Project',
    department: input.department || 'Operations',
    start_date: input.start_date || input.assigned_on || null,
    assigned_on: input.assigned_on || null,
    progress: isCompleted ? 100 : Math.max(0, Math.min(100, input.progress ?? 0)),
    remarks: isCompleted ? 'Closed' : input.remarks || 'Open',
    notes: input.notes?.trim() ?? '',
  };
}

export async function createTask(
  input: TaskInput,
  companyId?: string | null
): Promise<{ ok: boolean; migrationRequired: boolean; error: string | null }> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const fullPayload = buildRichPayload(input, companyId, user?.id ?? null);
  const { error } = await supabase.from('tasks').insert(fullPayload);

  if (!error) {
    if (input.assignee_id && input.assignee_id !== user?.id) {
      void createUserNotification({
        recipientId: input.assignee_id,
        companyId,
        title: `Assigned task: ${fullPayload.title}`,
        body: input.due_date ? `Due ${input.due_date}` : `Priority: ${fullPayload.priority}`,
        linkHref: '/tasks',
      });
    }
    return { ok: true, migrationRequired: false, error: null };
  }

  if (isMissingSchemaError(error)) {
    const basePayload = {
      title: fullPayload.title,
      description: fullPayload.description,
      status: fullPayload.status,
      priority: fullPayload.priority,
      assignee_id: fullPayload.assignee_id,
      creator_id: user?.id ?? null,
      due_date: fullPayload.due_date,
    };
    const { error: fallbackError } = await supabase.from('tasks').insert(basePayload);
    if (!fallbackError) {
      if (input.assignee_id && input.assignee_id !== user?.id) {
        void createUserNotification({
          recipientId: input.assignee_id,
          companyId,
          title: `Assigned task: ${fullPayload.title}`,
          body: input.due_date ? `Due ${input.due_date}` : `Priority: ${fullPayload.priority}`,
          linkHref: '/tasks',
        });
      }
      return { ok: true, migrationRequired: true, error: null };
    }
    return { ok: false, migrationRequired: true, error: fallbackError.message };
  }

  return { ok: false, migrationRequired: false, error: error.message };
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput>
): Promise<{ ok: boolean; migrationRequired: boolean; error: string | null }> {
  const supabase = createClient();

  let prevTask: { assignee_id: string | null; title: string | null; company_id: string | null } | null = null;
  if (typeof patch.assignee_id === 'string' && patch.assignee_id.length > 0) {
    const { data: existing } = await supabase
      .from('tasks')
      .select('assignee_id, title, company_id')
      .eq('id', id)
      .maybeSingle();
    if (existing) {
      prevTask = {
        assignee_id: existing.assignee_id ? String(existing.assignee_id) : null,
        title: existing.title ? String(existing.title) : null,
        company_id: existing.company_id ? String(existing.company_id) : null,
      };
    }
  }

  const richPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) richPatch.title = patch.title.trim();
  if (patch.description !== undefined) richPatch.description = patch.description.trim();
  if (patch.status !== undefined) {
    richPatch.status = patch.status;
    if (patch.status === 'Completed') {
      richPatch.progress = 100;
      richPatch.remarks = 'Closed';
      richPatch.completed_at = new Date().toISOString();
    }
  }
  if (patch.priority !== undefined) richPatch.priority = patch.priority;
  if (patch.assignee_id !== undefined) richPatch.assignee_id = patch.assignee_id || null;
  if (patch.due_date !== undefined) {
    richPatch.due_date = patch.due_date ? `${patch.due_date}T00:00:00Z` : null;
  }
  if (patch.category !== undefined) richPatch.category = patch.category;
  if (patch.department !== undefined) richPatch.department = patch.department;
  if (patch.start_date !== undefined) richPatch.start_date = patch.start_date || null;
  if (patch.assigned_on !== undefined) richPatch.assigned_on = patch.assigned_on || null;
  if (patch.progress !== undefined && patch.status !== 'Completed') {
    richPatch.progress = Math.max(0, Math.min(100, patch.progress));
  }
  if (patch.remarks !== undefined && patch.status !== 'Completed') {
    richPatch.remarks = patch.remarks;
  }
  if (patch.notes !== undefined) richPatch.notes = patch.notes.trim();

  const { error } = await supabase.from('tasks').update(richPatch).eq('id', id);

  if (!error) {
    if (
      typeof patch.assignee_id === 'string' &&
      patch.assignee_id.length > 0 &&
      patch.assignee_id !== prevTask?.assignee_id
    ) {
      void createUserNotification({
        recipientId: patch.assignee_id,
        companyId: prevTask?.company_id ?? null,
        title: `Assigned task: ${patch.title?.trim() || prevTask?.title || 'Task'}`,
        body: 'You were assigned to this task.',
        linkHref: '/tasks',
      });
    }
    return { ok: true, migrationRequired: false, error: null };
  }

  if (isMissingSchemaError(error)) {
    const basePatch: Record<string, unknown> = {};
    for (const key of ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date']) {
      if (richPatch[key] !== undefined) basePatch[key] = richPatch[key];
    }
    if (Object.keys(basePatch).length === 0) {
      return { ok: false, migrationRequired: true, error: 'Run supabase_migration.sql to edit extended task fields.' };
    }
    const { error: fallbackError } = await supabase.from('tasks').update(basePatch).eq('id', id);
    if (!fallbackError) {
      if (
        typeof patch.assignee_id === 'string' &&
        patch.assignee_id.length > 0 &&
        patch.assignee_id !== prevTask?.assignee_id
      ) {
        void createUserNotification({
          recipientId: patch.assignee_id,
          companyId: prevTask?.company_id ?? null,
          title: `Assigned task: ${patch.title?.trim() || prevTask?.title || 'Task'}`,
          body: 'You were assigned to this task.',
          linkHref: '/tasks',
        });
      }
      return { ok: true, migrationRequired: true, error: null };
    }
    return { ok: false, migrationRequired: true, error: fallbackError.message };
  }

  return { ok: false, migrationRequired: false, error: error.message };
}

export async function deleteTask(id: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function bulkUpdateTasks(
  ids: string[],
  patch: Partial<TaskInput>
): Promise<{ ok: boolean; migrationRequired: boolean; error: string | null }> {
  if (ids.length === 0) return { ok: true, migrationRequired: false, error: null };
  const supabase = createClient();
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) {
    payload.status = patch.status;
    if (patch.status === 'Completed') {
      payload.progress = 100;
      payload.remarks = 'Closed';
      payload.completed_at = new Date().toISOString();
    }
  }
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.assignee_id !== undefined) payload.assignee_id = patch.assignee_id || null;

  const { error } = await supabase.from('tasks').update(payload).in('id', ids);
  if (!error) return { ok: true, migrationRequired: false, error: null };

  if (isMissingSchemaError(error)) {
    const basePayload: Record<string, unknown> = {};
    for (const key of ['status', 'priority', 'assignee_id']) {
      if (payload[key] !== undefined) basePayload[key] = payload[key];
    }
    const { error: fallbackError } = await supabase.from('tasks').update(basePayload).in('id', ids);
    return {
      ok: !fallbackError,
      migrationRequired: true,
      error: fallbackError?.message ?? null,
    };
  }

  return { ok: false, migrationRequired: false, error: error.message };
}

export async function bulkDeleteTasks(
  ids: string[]
): Promise<{ ok: boolean; error: string | null }> {
  if (ids.length === 0) return { ok: true, error: null };
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().in('id', ids);
  return { ok: !error, error: error?.message ?? null };
}

export async function importTasksBatch(
  inputs: TaskInput[],
  companyId?: string | null
): Promise<{ count: number; migrationRequired: boolean; error: string | null }> {
  if (inputs.length === 0) return { count: 0, migrationRequired: false, error: null };
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const payloads = inputs.map((item) => buildRichPayload(item, companyId, user?.id ?? null));
  const { error } = await supabase.from('tasks').insert(payloads);

  if (!error) {
    return { count: payloads.length, migrationRequired: false, error: null };
  }

  if (isMissingSchemaError(error)) {
    const basePayloads = payloads.map((p) => ({
      title: p.title,
      description: p.description,
      status: p.status,
      priority: p.priority,
      assignee_id: p.assignee_id,
      creator_id: user?.id ?? null,
      due_date: p.due_date,
    }));
    const { error: fallbackError } = await supabase.from('tasks').insert(basePayloads);
    if (!fallbackError) {
      return { count: basePayloads.length, migrationRequired: true, error: null };
    }
    return { count: 0, migrationRequired: true, error: fallbackError.message };
  }

  return { count: 0, migrationRequired: false, error: error.message };
}

export async function listTaskSubtasks(
  taskId: string
): Promise<{ subtasks: TaskSubtask[]; schemaMissing: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position')
    .order('created_at');

  if (isMissingSchemaError(error)) {
    return { subtasks: [], schemaMissing: true };
  }
  return { subtasks: (data as TaskSubtask[]) ?? [], schemaMissing: false };
}

export async function addTaskSubtask(
  taskId: string,
  title: string,
  companyId?: string | null
): Promise<{ subtask: TaskSubtask | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_subtasks')
    .insert({
      task_id: taskId,
      ...(companyId ? { company_id: companyId } : {}),
      title: title.trim(),
    })
    .select()
    .single();

  return { subtask: (data as TaskSubtask) ?? null, error: error?.message ?? null };
}

export async function toggleTaskSubtask(
  id: string,
  isCompleted: boolean
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('task_subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function deleteTaskSubtask(id: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('task_subtasks').delete().eq('id', id);
  return { ok: !error, error: error?.message ?? null };
}

export async function listTaskComments(
  taskId: string
): Promise<{ comments: TaskComment[]; schemaMissing: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (isMissingSchemaError(error)) {
    return { comments: [], schemaMissing: true };
  }
  return { comments: (data as TaskComment[]) ?? [], schemaMissing: false };
}

export async function addTaskComment(
  taskId: string,
  body: string,
  author: { id?: string | null; name: string },
  companyId?: string | null
): Promise<{ comment: TaskComment | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      ...(companyId ? { company_id: companyId } : {}),
      author_id: author.id ?? null,
      author_name: author.name || 'Team Member',
      body: body.trim(),
    })
    .select()
    .single();

  if (!error && data) {
    const { data: taskRow } = await supabase
      .from('tasks')
      .select('title, assignee_id, creator_id, company_id')
      .eq('id', taskId)
      .maybeSingle();

    const recipients = Array.from(
      new Set(
        [taskRow?.assignee_id, taskRow?.creator_id].filter(
          (id): id is string => Boolean(id && id !== author.id)
        )
      )
    );

    const preview = body.trim().slice(0, 120);
    for (const recipientId of recipients) {
      void createUserNotification({
        recipientId,
        companyId: companyId ?? (taskRow?.company_id ? String(taskRow.company_id) : null),
        title: `New comment on "${String(taskRow?.title ?? 'Task')}"`,
        body: `${author.name || 'Team Member'}: ${preview}`,
        linkHref: '/tasks',
      });
    }
  }

  return { comment: (data as TaskComment) ?? null, error: error?.message ?? null };
}

export async function uploadTaskAttachment(
  taskId: string,
  file: File,
  existingAttachments: TaskAttachment[]
): Promise<{ attachment: TaskAttachment | null; error: string | null }> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${taskId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return { attachment: null, error: uploadError.message };
  }

  const nextAttachment: TaskAttachment = {
    name: file.name,
    path: filePath,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploaded_at: new Date().toISOString(),
  };

  const nextList = [...existingAttachments, nextAttachment];
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ attachments: nextList })
    .eq('id', taskId);

  if (updateError) {
    await supabase.storage.from('task-attachments').remove([filePath]);
    return { attachment: null, error: updateError.message };
  }

  return { attachment: nextAttachment, error: null };
}

export async function getAttachmentSignedUrl(
  path: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(path, 3600);

  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}

export async function removeTaskAttachment(
  taskId: string,
  attachment: TaskAttachment,
  existingAttachments: TaskAttachment[]
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const nextList = existingAttachments.filter((a) => a.path !== attachment.path);

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ attachments: nextList })
    .eq('id', taskId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await supabase.storage.from('task-attachments').remove([attachment.path]);
  return { ok: true, error: null };
}
