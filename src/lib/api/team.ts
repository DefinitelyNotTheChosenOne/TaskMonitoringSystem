import { createClient } from '@/utils/supabase/client';
import { invalidateWorkspaceContextCache } from '@/lib/api/tasks';
import { EmployeeDetailedProfile, EmployeeWorkloadSummary } from '@/lib/types/workspace';
import { TaskRecord, isTaskOverdue, normalizeTaskRow } from '@/lib/types/task';

export async function getTeamMembers() {
  const supabase = createClient();

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  return employees;
}

export async function getTeamWithWorkload(): Promise<{
  summaries: EmployeeWorkloadSummary[];
  currentUserRole: string | null;
  error: string | null;
}> {
  const supabase = createClient();

  const [
    {
      data: { session },
    },
    { data: empRows, error: empErr },
    { data: taskRows },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('employees').select('*').order('name'),
    supabase.from('tasks').select('*').order('due_date', { ascending: true }),
  ]);

  if (empErr) {
    return { summaries: [], currentUserRole: null, error: empErr.message };
  }

  const user = session?.user ?? null;

  const employees: EmployeeDetailedProfile[] = (empRows ?? []).map((row) => ({
    id: String(row.id),
    company_id: row.company_id ?? null,
    role: row.role ?? 'employee',
    name: row.name ?? 'Team Member',
    email: row.email ?? null,
    emp_id: row.emp_id ?? null,
    department: row.department ?? null,
    position: row.position ?? null,
    phone: row.phone ?? null,
    employee_status: row.employee_status ?? 'Active',
    date_of_birth: row.date_of_birth ?? null,
    date_of_hire: row.date_of_hire ?? null,
    home_address: row.home_address ?? null,
    emergency_contact_name: row.emergency_contact_name ?? null,
    emergency_contact_number: row.emergency_contact_number ?? null,
    tin: row.tin ?? null,
  }));

  const currentUserRole = user
    ? employees.find((e) => e.id === user.id)?.role ?? null
    : null;

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const tasksByAssignee = new Map<string, TaskRecord[]>();
  (taskRows ?? []).forEach((raw, idx) => {
    const normalized = normalizeTaskRow(raw as Record<string, unknown>, empMap, idx);
    if (!normalized.assignee_id) return;
    const list = tasksByAssignee.get(normalized.assignee_id) ?? [];
    list.push(normalized);
    tasksByAssignee.set(normalized.assignee_id, list);
  });

  const summaries: EmployeeWorkloadSummary[] = employees.map((employee) => {
    const empTasks = tasksByAssignee.get(employee.id) ?? [];
    const totalTasks = empTasks.length;
    const completedTasks = empTasks.filter((t) => t.status === 'Completed').length;
    const overdueTasks = empTasks.filter((t) => isTaskOverdue(t)).length;
    const activeTasks = empTasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled'
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      employee,
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      tasks: empTasks,
    };
  });

  return { summaries, currentUserRole, error: null };
}

export async function updateEmployeeDetails(
  id: string,
  patch: Partial<{
    name: string;
    emp_id: string | null;
    department: string | null;
    position: string | null;
    phone: string | null;
    employee_status: string | null;
    date_of_hire: string | null;
    date_of_birth: string | null;
    home_address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_number: string | null;
    tin: string | null;
  }>
): Promise<{ ok: boolean; migrationRequired: boolean; error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.from('employees').update(patch).eq('id', id);
  if (!error) {
    invalidateWorkspaceContextCache();
    return { ok: true, migrationRequired: false, error: null };
  }

  const code = error.code ?? '';
  if (code === '42703' || code === 'PGRST204') {
    const basePatch: Record<string, unknown> = {};
    for (const key of ['name', 'emp_id', 'department', 'position']) {
      if (patch[key as keyof typeof patch] !== undefined) {
        basePatch[key] = patch[key as keyof typeof patch];
      }
    }
    const { error: fallbackError } = await supabase
      .from('employees')
      .update(basePatch)
      .eq('id', id);
    if (!fallbackError) {
      invalidateWorkspaceContextCache();
    }
    return {
      ok: !fallbackError,
      migrationRequired: true,
      error: fallbackError?.message ?? null,
    };
  }

  return { ok: false, migrationRequired: false, error: error.message };
}
