import { createClient } from '@/utils/supabase/client';

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
