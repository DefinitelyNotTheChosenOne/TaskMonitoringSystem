'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getCurrentUserContext } from '@/lib/auth';
import { DEFAULT_CATEGORIES, DEFAULT_DEPARTMENTS } from '@/lib/types/task';
import { revalidatePath } from 'next/cache';

async function requireSuperadmin() {
  const ctx = await getCurrentUserContext();
  if (!ctx || ctx.role !== 'superadmin') {
    return { error: 'Superadmin authorization required.' as const };
  }
  return { error: null };
}

function getServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export interface CompanyWithStats {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  created_at: string;
  userCount: number;
  taskCount: number;
}

export async function listCompaniesWithStats(): Promise<{
  companies: CompanyWithStats[];
  schemaMissing: boolean;
  error: string | null;
}> {
  const guard = await requireSuperadmin();
  if (guard.error) {
    return { companies: [], schemaMissing: false, error: guard.error };
  }

  const serverClient = await createServerClient();
  const { data: compRows, error: compErr } = await serverClient
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (compErr) {
    const code = compErr.code ?? '';
    if (code === '42P01' || code === 'PGRST205') {
      return { companies: [], schemaMissing: true, error: null };
    }
    return { companies: [], schemaMissing: false, error: compErr.message };
  }

  const [{ data: empRows }, { data: taskRows }] = await Promise.all([
    serverClient.from('employees').select('company_id'),
    serverClient.from('tasks').select('company_id'),
  ]);

  const userCounts = new Map<string, number>();
  for (const row of empRows ?? []) {
    if (row.company_id) {
      userCounts.set(row.company_id, (userCounts.get(row.company_id) ?? 0) + 1);
    }
  }

  const taskCounts = new Map<string, number>();
  for (const row of taskRows ?? []) {
    if (row.company_id) {
      taskCounts.set(row.company_id, (taskCounts.get(row.company_id) ?? 0) + 1);
    }
  }

  const companies: CompanyWithStats[] = (compRows ?? []).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    tagline: String(c.tagline ?? ''),
    mission: String(c.mission ?? ''),
    created_at: String(c.created_at ?? ''),
    userCount: userCounts.get(String(c.id)) ?? 0,
    taskCount: taskCounts.get(String(c.id)) ?? 0,
  }));

  return { companies, schemaMissing: false, error: null };
}

export async function createCompanyWithOptionalAdmin(formData: FormData) {
  const guard = await requireSuperadmin();
  if (guard.error) return { error: guard.error };

  const name = (formData.get('name') as string)?.trim();
  const tagline =
    (formData.get('tagline') as string)?.trim() || 'Team Task Management Workspace';
  const mission =
    (formData.get('mission') as string)?.trim() ||
    'Deliver high-quality, innovative solutions that empower teams to collaborate efficiently.';

  const adminName = (formData.get('admin_name') as string)?.trim();
  const adminEmail = (formData.get('admin_email') as string)?.trim();
  const adminPassword = (formData.get('admin_password') as string) || '';

  if (!name) return { error: 'Company name is required.' };

  const serverClient = await createServerClient();
  const { data: createdCompany, error: compErr } = await serverClient
    .from('companies')
    .insert({ name, tagline, mission })
    .select('id')
    .single();

  if (compErr || !createdCompany) {
    return { error: compErr?.message ?? 'Failed to create company.' };
  }

  const companyId = String(createdCompany.id);

  // Seed default workspace categories and departments for the new tenant
  const seedOptions = [
    ...DEFAULT_CATEGORIES.map((label, idx) => ({
      company_id: companyId,
      option_type: 'category',
      label,
      sort_order: idx,
    })),
    ...DEFAULT_DEPARTMENTS.map((label, idx) => ({
      company_id: companyId,
      option_type: 'department',
      label,
      sort_order: idx,
    })),
  ];
  await serverClient.from('workspace_options').insert(seedOptions);

  // Optionally create initial Company Admin user
  if (adminEmail && adminPassword) {
    const adminAuthClient = getServiceClient();
    if (!adminAuthClient) {
      revalidatePath('/superadmin/companies');
      return {
        success: 'Company created, but SUPABASE_SERVICE_ROLE_KEY is missing to auto-create the initial admin.',
      };
    }

    const { data: newUser, error: authErr } = await adminAuthClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authErr || !newUser.user) {
      revalidatePath('/superadmin/companies');
      return {
        error: `Company created, but initial admin account failed: ${authErr?.message ?? 'Unknown error'}`,
      };
    }

    const { error: empErr } = await adminAuthClient.from('employees').insert({
      id: newUser.user.id,
      company_id: companyId,
      role: 'admin',
      name: adminName || adminEmail.split('@')[0],
      email: adminEmail,
      position: 'Workspace Administrator',
      department: 'Admin',
    });

    if (empErr) {
      await adminAuthClient.auth.admin.deleteUser(newUser.user.id);
      revalidatePath('/superadmin/companies');
      return { error: `Company created, but linking admin failed: ${empErr.message}` };
    }
  }

  revalidatePath('/superadmin/companies');
  return { success: `Company "${name}" onboarded successfully.` };
}

export async function updateCompanyAction(formData: FormData) {
  const guard = await requireSuperadmin();
  if (guard.error) return { error: guard.error };

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const tagline = (formData.get('tagline') as string)?.trim() || '';
  const mission = (formData.get('mission') as string)?.trim() || '';

  if (!id || !name) return { error: 'Company name is required.' };

  const serverClient = await createServerClient();
  const { error } = await serverClient
    .from('companies')
    .update({ name, tagline, mission })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/superadmin/companies');
  return { success: 'Company updated successfully.' };
}

export async function deleteCompanyAction(id: string) {
  const guard = await requireSuperadmin();
  if (guard.error) return { error: guard.error };

  const serverClient = await createServerClient();
  const { error } = await serverClient.from('companies').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/superadmin/companies');
  return { success: 'Company removed.' };
}
