import { createClient } from '@/utils/supabase/server';
import { getCurrentUserContext } from '@/lib/auth';
import {
  CompanyProfile,
  DEFAULT_CATEGORIES,
  DEFAULT_DEPARTMENTS,
  DashboardAnalytics,
  EmployeeProfile,
  computeDashboardAnalytics,
  normalizeTaskRow,
} from '@/lib/types/task';

export interface InitialDashboardData {
  company: CompanyProfile;
  analytics: DashboardAnalytics;
  schemaReady: boolean;
  loadError: string | null;
  initialMonth: string;
  initialYear: string;
}

const DEFAULT_SERVER_COMPANY: CompanyProfile = {
  id: 'default',
  name: 'Workspace',
  tagline: 'Team Task Management Workspace',
  mission: 'Organize, prioritize, and track your team deliverables.',
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

export async function getServerDashboardData(
  month: string,
  year: string
): Promise<InitialDashboardData> {
  const [userContext, supabase] = await Promise.all([getCurrentUserContext(), createClient()]);

  const [
    { data: empRows },
    { data: optionRows, error: optionsError },
    { data: taskRows, error: taskError },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('id, company_id, role, name, email, emp_id, department, position')
      .order('name'),
    supabase
      .from('workspace_options')
      .select('option_type, label, sort_order')
      .order('sort_order'),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
  ]);

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

  const schemaReady = !isMissingSchemaError(optionsError);
  const company = userContext?.company ?? DEFAULT_SERVER_COMPANY;

  if (taskError) {
    const emptyAnalytics = computeDashboardAnalytics(
      [],
      month,
      year,
      userContext?.userId ?? null,
      categories,
      departments
    );
    return {
      company,
      analytics: emptyAnalytics,
      schemaReady,
      loadError: taskError.message,
      initialMonth: month,
      initialYear: year,
    };
  }

  const employeeMap = new Map<string, EmployeeProfile>(employees.map((e) => [e.id, e]));
  const tasks = (taskRows ?? []).map((row, idx) =>
    normalizeTaskRow(row as Record<string, unknown>, employeeMap, idx)
  );

  const analytics = computeDashboardAnalytics(
    tasks,
    month,
    year,
    userContext?.userId ?? null,
    categories,
    departments
  );

  return {
    company,
    analytics,
    schemaReady,
    loadError: null,
    initialMonth: month,
    initialYear: year,
  };
}
