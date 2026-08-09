'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: FormData) {
  // 1. Verify the current user is an admin or superadmin
  const serverClient = await createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: currentUserData } = await serverClient
    .from('employees')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!currentUserData || (currentUserData.role !== 'admin' && currentUserData.role !== 'superadmin')) {
    return { error: 'Insufficient permissions' }
  }

  // 2. Extract form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const empId = formData.get('emp_id') as string
  const department = formData.get('department') as string
  const position = formData.get('position') as string

  if (!email || !password || !name) {
    return { error: 'Missing required fields' }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Server configuration error: Missing Service Role Key' }
  }

  // 3. Use Admin API to create the user without logging them in
  const adminAuthClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: newAuthUser, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto confirm so they can log in immediately
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!newAuthUser.user) {
    return { error: 'Failed to create user' }
  }

  // 4. Insert into employees table
  const { error: dbError } = await adminAuthClient
    .from('employees')
    .insert({
      id: newAuthUser.user.id,
      company_id: currentUserData.company_id, // Inherit admin's company
      role: 'employee', // Hardcoded as requested
      name,
      email,
      emp_id: empId,
      department,
      position
    })

  if (dbError) {
    // Attempt rollback
    await adminAuthClient.auth.admin.deleteUser(newAuthUser.user.id)
    return { error: dbError.message }
  }

  revalidatePath('/admin/users')
  return { success: 'Employee created successfully!' }
}
