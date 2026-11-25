'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdminContext() {
  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) return { error: 'Unauthorized' as const, context: null };

  const { data: currentUserData } = await serverClient
    .from('employees')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (
    !currentUserData ||
    (currentUserData.role !== 'admin' && currentUserData.role !== 'superadmin')
  ) {
    return { error: 'Insufficient permissions' as const, context: null };
  }

  return {
    error: null,
    context: {
      userId: user.id,
      role: currentUserData.role as string,
      companyId: (currentUserData.company_id as string | null) ?? null,
    },
  };
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

export async function createEmployee(formData: FormData) {
  const authCheck = await requireAdminContext();
  if (authCheck.error || !authCheck.context) {
    return { error: authCheck.error ?? 'Unauthorized' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const empId = formData.get('emp_id') as string;
  const department = formData.get('department') as string;
  const position = formData.get('position') as string;

  if (!email || !password || !name) {
    return { error: 'Missing required fields' };
  }

  const adminAuthClient = getServiceClient();
  if (!adminAuthClient) {
    return { error: 'Server configuration error: Missing Service Role Key' };
  }

  const { data: newAuthUser, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!newAuthUser.user) {
    return { error: 'Failed to create user' };
  }

  const { error: dbError } = await adminAuthClient.from('employees').insert({
    id: newAuthUser.user.id,
    company_id: authCheck.context.companyId,
    role: 'employee',
    name,
    email,
    emp_id: empId || null,
    department: department || null,
    position: position || null,
  });

  if (dbError) {
    await adminAuthClient.auth.admin.deleteUser(newAuthUser.user.id);
    return { error: dbError.message };
  }

  revalidatePath('/admin/users');
  revalidatePath('/team');
  return { success: 'Employee created successfully!' };
}

export async function listCompanyUsers() {
  const authCheck = await requireAdminContext();
  if (authCheck.error || !authCheck.context) {
    return { users: [], error: authCheck.error ?? 'Unauthorized' };
  }

  const serverClient = await createServerClient();
  let query = serverClient.from('employees').select('*').order('name');

  if (authCheck.context.role !== 'superadmin' && authCheck.context.companyId) {
    query = query.eq('company_id', authCheck.context.companyId);
  }

  const { data, error } = await query;
  return { users: data ?? [], error: error?.message ?? null };
}

export async function updateCompanyUser(formData: FormData) {
  const authCheck = await requireAdminContext();
  if (authCheck.error || !authCheck.context) {
    return { error: authCheck.error ?? 'Unauthorized' };
  }

  const targetId = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const empId = (formData.get('emp_id') as string)?.trim() || null;
  const department = (formData.get('department') as string)?.trim() || null;
  const position = (formData.get('position') as string)?.trim() || null;
  const employeeStatus = (formData.get('employee_status') as string)?.trim() || 'Active';

  if (!targetId || !name) {
    return { error: 'Missing required user details' };
  }

  const adminClient = getServiceClient();
  const db = adminClient ?? (await createServerClient());

  const { data: targetRow } = await db
    .from('employees')
    .select('company_id')
    .eq('id', targetId)
    .single();

  if (
    authCheck.context.role !== 'superadmin' &&
    authCheck.context.companyId &&
    targetRow?.company_id !== authCheck.context.companyId
  ) {
    return { error: 'Cannot edit users outside your company' };
  }

  const { error } = await db
    .from('employees')
    .update({
      name,
      emp_id: empId,
      department,
      position,
      employee_status: employeeStatus,
    })
    .eq('id', targetId);

  if (error) {
    // Fallback if employee_status column not yet migrated
    if (error.code === '42703' || error.code === 'PGRST204') {
      const { error: baseErr } = await db
        .from('employees')
        .update({ name, emp_id: empId, department, position })
        .eq('id', targetId);
      if (baseErr) return { error: baseErr.message };
    } else {
      return { error: error.message };
    }
  }

  revalidatePath('/admin/users');
  revalidatePath('/team');
  return { success: 'User updated successfully.' };
}

export async function resetCompanyUserPassword(formData: FormData) {
  const authCheck = await requireAdminContext();
  if (authCheck.error || !authCheck.context) {
    return { error: authCheck.error ?? 'Unauthorized' };
  }

  const targetId = formData.get('id') as string;
  const newPassword = formData.get('new_password') as string;

  if (!targetId || !newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const adminAuthClient = getServiceClient();
  if (!adminAuthClient) {
    return { error: 'Server configuration error: Missing Service Role Key' };
  }

  const { data: targetRow } = await adminAuthClient
    .from('employees')
    .select('company_id')
    .eq('id', targetId)
    .single();

  if (
    authCheck.context.role !== 'superadmin' &&
    authCheck.context.companyId &&
    targetRow?.company_id !== authCheck.context.companyId
  ) {
    return { error: 'Cannot reset password for users outside your company' };
  }

  const { error } = await adminAuthClient.auth.admin.updateUserById(targetId, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { success: 'Password updated successfully.' };
}

export async function deleteCompanyUser(targetId: string) {
  const authCheck = await requireAdminContext();
  if (authCheck.error || !authCheck.context) {
    return { error: authCheck.error ?? 'Unauthorized' };
  }

  if (targetId === authCheck.context.userId) {
    return { error: 'You cannot delete your own active account.' };
  }

  const adminAuthClient = getServiceClient();
  if (!adminAuthClient) {
    return { error: 'Server configuration error: Missing Service Role Key' };
  }

  const { data: targetRow } = await adminAuthClient
    .from('employees')
    .select('company_id, role')
    .eq('id', targetId)
    .single();

  if (
    authCheck.context.role !== 'superadmin' &&
    (targetRow?.company_id !== authCheck.context.companyId ||
      targetRow?.role === 'superadmin')
  ) {
    return { error: 'Insufficient permissions to remove this user.' };
  }

  const { error } = await adminAuthClient.auth.admin.deleteUser(targetId);
  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  revalidatePath('/team');
  return { success: 'User account removed.' };
}
