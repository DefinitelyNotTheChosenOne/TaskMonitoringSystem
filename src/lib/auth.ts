import { createClient } from '@/utils/supabase/server';

export async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: employee } = await supabase
    .from('employees')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
    
  return employee?.role || null;
}
