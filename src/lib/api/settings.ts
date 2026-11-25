import { createClient } from '@/utils/supabase/client';
import { invalidateWorkspaceContextCache } from '@/lib/api/tasks';
import {
  CompanyProfile,
  DEFAULT_CATEGORIES,
  DEFAULT_DEPARTMENTS,
} from '@/lib/types/task';
import { EmployeeDetailedProfile, WorkspaceOptionItem } from '@/lib/types/workspace';

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

export async function getCurrentSettingsData(): Promise<{
  profile: EmployeeDetailedProfile | null;
  company: CompanyProfile | null;
  options: WorkspaceOptionItem[];
  schemaReady: boolean;
}> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  if (!user) {
    return { profile: null, company: null, options: [], schemaReady: true };
  }

  const [
    { data: empRow },
    { data: optRows, error: optErr },
  ] = await Promise.all([
    supabase.from('employees').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('workspace_options')
      .select('id, option_type, label, sort_order')
      .order('sort_order')
      .order('label'),
  ]);

  const profile: EmployeeDetailedProfile = empRow
    ? {
        id: String(empRow.id),
        company_id: empRow.company_id ?? null,
        role: empRow.role ?? 'employee',
        name: empRow.name ?? 'Team Member',
        email: empRow.email ?? user.email ?? null,
        emp_id: empRow.emp_id ?? null,
        department: empRow.department ?? null,
        position: empRow.position ?? null,
        phone: empRow.phone ?? null,
        employee_status: empRow.employee_status ?? 'Active',
      }
    : {
        id: user.id,
        company_id: null,
        role: 'employee',
        name: user.email?.split('@')[0] ?? 'User',
        email: user.email ?? null,
        emp_id: null,
        department: null,
        position: null,
        phone: null,
        employee_status: 'Active',
      };

  let schemaReady = true;
  let company: CompanyProfile | null = null;

  if (profile.company_id) {
    const { data: compRow, error: compErr } = await supabase
      .from('companies')
      .select('id, name, tagline, mission, logo_url')
      .eq('id', profile.company_id)
      .maybeSingle();

    if (isMissingSchemaError(compErr)) {
      schemaReady = false;
    } else if (compRow) {
      company = {
        id: String(compRow.id),
        name: compRow.name ?? 'Company',
        tagline: compRow.tagline ?? '',
        mission: compRow.mission ?? '',
        logo_url: compRow.logo_url ?? null,
      };
    }
  }

  let options: WorkspaceOptionItem[] = [];
  if (isMissingSchemaError(optErr)) {
    schemaReady = false;
  } else {
    options = (optRows ?? []) as WorkspaceOptionItem[];
  }

  return { profile, company, options, schemaReady };
}

export async function saveOwnProfile(
  userId: string,
  patch: { name: string; phone?: string; position?: string }
): Promise<{ ok: boolean; migrationRequired: boolean; error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('employees')
    .update({
      name: patch.name.trim(),
      phone: patch.phone?.trim() || null,
      position: patch.position?.trim() || null,
    })
    .eq('id', userId);

  if (!error) {
    invalidateWorkspaceContextCache();
    return { ok: true, migrationRequired: false, error: null };
  }

  if (isMissingSchemaError(error)) {
    const { error: fallbackErr } = await supabase
      .from('employees')
      .update({
        name: patch.name.trim(),
        position: patch.position?.trim() || null,
      })
      .eq('id', userId);
    if (!fallbackErr) {
      invalidateWorkspaceContextCache();
    }
    return {
      ok: !fallbackErr,
      migrationRequired: true,
      error: fallbackErr?.message ?? null,
    };
  }

  return { ok: false, migrationRequired: false, error: error.message };
}

export async function changeOwnPassword(
  newPassword: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { ok: !error, error: error?.message ?? null };
}

export async function saveCompanyBranding(
  companyId: string,
  patch: { name: string; tagline: string; mission: string; logo_url?: string | null }
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('companies')
    .update({
      name: patch.name.trim(),
      tagline: patch.tagline.trim(),
      mission: patch.mission.trim(),
      logo_url: patch.logo_url?.trim() || null,
    })
    .eq('id', companyId);

  if (!error) {
    invalidateWorkspaceContextCache();
  }
  return { ok: !error, error: error?.message ?? null };
}

export async function addWorkspaceOption(
  companyId: string | null,
  optionType: 'category' | 'department',
  label: string
): Promise<{ option: WorkspaceOptionItem | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_options')
    .insert({
      ...(companyId ? { company_id: companyId } : {}),
      option_type: optionType,
      label: label.trim(),
    })
    .select('id, option_type, label, sort_order')
    .single();

  if (!error) {
    invalidateWorkspaceContextCache();
  }
  return { option: (data as WorkspaceOptionItem) ?? null, error: error?.message ?? null };
}

export async function deleteWorkspaceOption(
  id: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('workspace_options').delete().eq('id', id);
  if (!error) {
    invalidateWorkspaceContextCache();
  }
  return { ok: !error, error: error?.message ?? null };
}

export async function seedDefaultOptionsIfEmpty(
  companyId: string | null
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createClient();
  const rows = [
    ...DEFAULT_CATEGORIES.map((label, idx) => ({
      ...(companyId ? { company_id: companyId } : {}),
      option_type: 'category' as const,
      label,
      sort_order: idx,
    })),
    ...DEFAULT_DEPARTMENTS.map((label, idx) => ({
      ...(companyId ? { company_id: companyId } : {}),
      option_type: 'department' as const,
      label,
      sort_order: idx,
    })),
  ];

  const { error } = await supabase.from('workspace_options').insert(rows);
  if (!error) {
    invalidateWorkspaceContextCache();
  }
  return { ok: !error, error: error?.message ?? null };
}
