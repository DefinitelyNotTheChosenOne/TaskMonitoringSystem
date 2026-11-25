import { EmployeeProfile, TaskRecord } from '@/lib/types/task';

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  company_id: string | null;
  item_no: string;
  action_item: string;
  person_responsible: string;
  assignee_id: string | null;
  objective: string;
  due_date: string;
  status: string;
  linked_task_id: string | null;
  created_at: string;
}

export interface MeetingRecord {
  id: string;
  company_id: string | null;
  meeting_no: string;
  title: string;
  objective: string;
  participants: string;
  organizer: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  agenda: string[];
  minutes: string[];
  action_items: MeetingActionItem[];
  created_at: string;
}

export interface MeetingInput {
  meeting_no: string;
  title: string;
  objective: string;
  participants: string;
  organizer: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  agenda: string[];
  minutes: string[];
}

export interface EmployeeDetailedProfile extends EmployeeProfile {
  date_of_birth?: string | null;
  date_of_hire?: string | null;
  home_address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  tin?: string | null;
}

export interface EmployeeWorkloadSummary {
  employee: EmployeeDetailedProfile;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasks: TaskRecord[];
}

export interface NotificationAlert {
  id: string;
  source: 'db' | 'overdue' | 'due_today' | 'upcoming';
  title: string;
  body: string;
  linkHref: string;
  isRead: boolean;
  createdAt: string;
}

export interface WorkspaceOptionItem {
  id: string;
  option_type: 'category' | 'department';
  label: string;
  sort_order: number;
}
