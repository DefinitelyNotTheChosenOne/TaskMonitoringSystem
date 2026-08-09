import { createClient } from '@/utils/supabase/client';

export async function getDashboardStats() {
  const supabase = createClient();
  
  // In a real scenario, you could perform a single RPC call to get all this, 
  // or fetch tasks and compute on the client. 
  // We'll fetch the tasks and compute the stats.
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*');
    
  if (error) {
    console.error('Error fetching tasks for stats:', error);
    return null;
  }
  
  // Aggregate priorities
  const priorities = { Low: 0, Medium: 0, High: 0, 'Very High': 0, Critical: 0 };
  const statuses = { 'Not Started': 0, 'In Progress': 0, 'On Hold': 0, 'Active': 0, 'In Review': 0, 'Completed': 0, 'Overdue': 0, 'Cancelled': 0 };
  
  tasks.forEach(task => {
    if (task.priority && priorities[task.priority as keyof typeof priorities] !== undefined) {
      priorities[task.priority as keyof typeof priorities]++;
    }
    if (task.status && statuses[task.status as keyof typeof statuses] !== undefined) {
      statuses[task.status as keyof typeof statuses]++;
    }
  });
  
  const priorityData = [
    { name: 'Low', value: priorities.Low, color: '#10b981' },
    { name: 'Medium', value: priorities.Medium, color: '#3b82f6' },
    { name: 'High', value: priorities.High, color: '#f59e0b' },
    { name: 'Very High', value: priorities['Very High'], color: '#f97316' },
    { name: 'Critical', value: priorities.Critical, color: '#ef4444' },
  ].filter(p => p.value > 0);
  
  const statusData = Object.entries(statuses).map(([name, tasksCount]) => ({
    name,
    tasks: tasksCount
  }));

  // We can also aggregate departments and categories dynamically here.
  // We'll return the raw tasks as well for the client to process if needed.

  return { priorityData, statusData, tasks };
}
