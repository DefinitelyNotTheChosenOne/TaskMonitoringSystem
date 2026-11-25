export const TASK_STATUSES = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Active',
  'In Review',
  'Completed',
  'Overdue',
  'Cancelled',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Very High',
  'Critical',
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_REMARKS = ['Open', 'Closed'] as const;
export type TaskRemark = (typeof TASK_REMARKS)[number];

export const DEFAULT_CATEGORIES = [
  'Project',
  'Design',
  'Meeting',
  'Development',
  'Client Work',
  'Support',
  'Training',
  'Quality Control',
  'Research',
  'Sales',
] as const;

export const DEFAULT_DEPARTMENTS = [
  'Admin',
  'Production',
  'Marketing',
  'Operations',
  'Finance',
] as const;

export interface EmployeeProfile {
  id: string;
  company_id: string | null;
  role: string;
  name: string;
  email: string | null;
  emp_id: string | null;
  department: string | null;
  position: string | null;
  phone?: string | null;
  employee_status?: string | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  logo_url?: string | null;
}

export function isSafeLogoUrl(url?: string | null): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/png;base64,') ||
    trimmed.startsWith('data:image/jpeg;base64,') ||
    trimmed.startsWith('data:image/webp;base64,') ||
    trimmed.startsWith('data:image/gif;base64,')
  );
}

export interface TaskAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface TaskRecord {
  id: string;
  company_id: string | null;
  task_code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  assignee_id: string | null;
  assignee_name: string;
  assignee_initials: string;
  creator_id: string | null;
  start_date: string;
  due_date: string;
  assigned_on: string;
  progress: number;
  remarks: string;
  notes: string;
  attachments: TaskAttachment[];
  completed_at: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  assignee_id: string | null;
  start_date?: string | null;
  due_date?: string | null;
  assigned_on?: string | null;
  progress?: number;
  remarks?: string;
  notes?: string;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  company_id: string | null;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  company_id: string | null;
  author_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
}

export interface WorkspaceContext {
  userId: string | null;
  currentEmployee: EmployeeProfile | null;
  company: CompanyProfile;
  employees: EmployeeProfile[];
  categories: string[];
  departments: string[];
  schemaReady: boolean;
}

export interface BreakdownBarItem {
  name: string;
  completed: number;
  notCompleted: number;
  total: number;
}

export interface TrendPoint {
  label: string;
  total: number;
  completed: number;
  rate: number;
  tasks: number;
}

export interface DashboardAnalytics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  openTasks: number;
  closedTasks: number;
  dueTodayCount: number;
  overdueCount: number;
  overdueLastWeek: number;
  ongoingThisWeek: number;
  upcomingNextWeek: number;
  dueTodayByPriority: { label: string; count: number; tone: string }[];
  dueTodayByStatus: { label: string; count: number }[];
  dueTodayByCategory: { label: string; count: number }[];
  priorityData: { name: string; value: number; color: string }[];
  statusData: { name: string; tasks: number }[];
  departmentData: BreakdownBarItem[];
  categoryData: BreakdownBarItem[];
  last7DaysData: { day: string; tasks: number; completed: number }[];
  monthlyData: { day: number; label: string; total: number; completed: number; rate: number; tasks: number }[];
  yearlyData: { month: string; shortMonth: string; total: number; completed: number; rate: number; tasks: number }[];
  focusTasks: TaskRecord[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PRIORITY_COLORS: Record<string, string> = {
  Low: '#15803D',
  Medium: '#2563EB',
  High: '#B45309',
  'Very High': '#C2410C',
  Critical: '#B91C1C',
};

export function toISODateOnly(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalMidnight(isoDate: string): Date | null {
  if (!isoDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, monthIndex, day);
}

export function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDaysLeft(dueDate: string | null | undefined): number | null {
  const due = parseLocalMidnight(toISODateOnly(dueDate));
  if (!due) return null;
  const today = getTodayMidnight();
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isTaskOverdue(task: Pick<TaskRecord, 'status' | 'due_date'>): boolean {
  if (task.status === 'Completed' || task.status === 'Cancelled') return false;
  if (task.status === 'Overdue') return true;
  const daysLeft = computeDaysLeft(task.due_date);
  return daysLeft !== null && daysLeft < 0;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UN';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function normalizeTaskRow(
  raw: Record<string, unknown>,
  employeeMap: Map<string, EmployeeProfile>,
  fallbackIndex = 0
): TaskRecord {
  const assigneeId = typeof raw.assignee_id === 'string' ? raw.assignee_id : null;
  const employee = assigneeId ? employeeMap.get(assigneeId) : undefined;
  const assigneeName = employee?.name || 'Unassigned';

  const createdAt = typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString();
  const assignedOn =
    toISODateOnly(typeof raw.assigned_on === 'string' ? raw.assigned_on : createdAt) || getTodayISO();
  const dueDate = toISODateOnly(typeof raw.due_date === 'string' ? raw.due_date : '');
  const startDate =
    toISODateOnly(typeof raw.start_date === 'string' ? raw.start_date : '') || assignedOn;

  const status = typeof raw.status === 'string' && raw.status ? raw.status : 'Not Started';
  const rawProgress = typeof raw.progress === 'number' ? raw.progress : Number(raw.progress ?? 0);
  const progress =
    status === 'Completed'
      ? 100
      : Number.isFinite(rawProgress)
        ? Math.max(0, Math.min(100, Math.round(rawProgress)))
        : 0;

  const rawCode = typeof raw.task_code === 'string' ? raw.task_code.trim() : '';
  const taskCode = rawCode || `TSK-${String(fallbackIndex + 1).padStart(3, '0')}`;

  return {
    id: String(raw.id ?? ''),
    company_id: typeof raw.company_id === 'string' ? raw.company_id : null,
    task_code: taskCode,
    title: typeof raw.title === 'string' ? raw.title : 'Untitled Task',
    description: typeof raw.description === 'string' ? raw.description : '',
    status,
    priority: typeof raw.priority === 'string' && raw.priority ? raw.priority : 'Medium',
    category: typeof raw.category === 'string' && raw.category ? raw.category : 'Project',
    department:
      typeof raw.department === 'string' && raw.department
        ? raw.department
        : employee?.department || 'Operations',
    assignee_id: assigneeId,
    assignee_name: assigneeName,
    assignee_initials: assigneeId ? getInitials(assigneeName) : '--',
    creator_id: typeof raw.creator_id === 'string' ? raw.creator_id : null,
    start_date: startDate,
    due_date: dueDate,
    assigned_on: assignedOn,
    progress,
    remarks:
      typeof raw.remarks === 'string' && raw.remarks
        ? raw.remarks
        : status === 'Completed'
          ? 'Closed'
          : 'Open',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as TaskAttachment[]).filter(
          (a) => a && typeof a.name === 'string' && typeof a.path === 'string'
        )
      : [],
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
    created_at: createdAt,
  };
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getTaskWeekBuckets(task: Pick<TaskRecord, 'status' | 'due_date'>) {
  const due = parseLocalMidnight(task.due_date);
  const today = getTodayMidnight();
  const thisMonday = getMondayOfWeek(today);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  const nextSunday = new Date(thisMonday);
  nextSunday.setDate(thisMonday.getDate() + 13);

  const isActive = task.status !== 'Completed' && task.status !== 'Cancelled';
  const dueMs = due ? due.getTime() : null;

  return {
    dueToday: dueMs !== null && dueMs === today.getTime(),
    overdueLastWeek:
      isActive && dueMs !== null && dueMs >= lastMonday.getTime() && dueMs <= lastSunday.getTime(),
    ongoingThisWeek:
      isActive && dueMs !== null && dueMs >= thisMonday.getTime() && dueMs <= thisSunday.getTime(),
    upcomingNextWeek:
      isActive && dueMs !== null && dueMs >= nextMonday.getTime() && dueMs <= nextSunday.getTime(),
  };
}

export function computeDashboardAnalytics(
  tasks: TaskRecord[],
  month: string,
  year: string,
  currentUserId?: string | null,
  categoriesList: readonly string[] = DEFAULT_CATEGORIES,
  departmentsList: readonly string[] = DEFAULT_DEPARTMENTS
): DashboardAnalytics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const closedTasks = tasks.filter((t) => t.remarks === 'Closed' || t.status === 'Completed').length;
  const openTasks = totalTasks - closedTasks;

  const priorityCounts: Record<string, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    'Very High': 0,
    Critical: 0,
  };
  const statusCounts: Record<string, number> = {
    'Not Started': 0,
    'In Progress': 0,
    'On Hold': 0,
    Active: 0,
    'In Review': 0,
    Completed: 0,
    Overdue: 0,
    Cancelled: 0,
  };

  const deptMap = new Map<string, { completed: number; notCompleted: number }>();
  for (const dept of departmentsList) {
    deptMap.set(dept, { completed: 0, notCompleted: 0 });
  }

  const catMap = new Map<string, { completed: number; notCompleted: number }>();
  for (const cat of categoriesList) {
    catMap.set(cat, { completed: 0, notCompleted: 0 });
  }

  let dueTodayCount = 0;
  let overdueCount = 0;
  let overdueLastWeek = 0;
  let ongoingThisWeek = 0;
  let upcomingNextWeek = 0;

  const dueTodayPriorityCounts: Record<string, number> = {
    Critical: 0,
    'Very High': 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  const dueTodayStatusCounts: Record<string, number> = {};
  const dueTodayCategoryCounts: Record<string, number> = {};

  for (const task of tasks) {
    if (priorityCounts[task.priority] !== undefined) {
      priorityCounts[task.priority] += 1;
    }
    if (statusCounts[task.status] !== undefined) {
      statusCounts[task.status] += 1;
    } else {
      statusCounts[task.status] = 1;
    }

    const deptEntry = deptMap.get(task.department) ?? { completed: 0, notCompleted: 0 };
    if (task.status === 'Completed') deptEntry.completed += 1;
    else deptEntry.notCompleted += 1;
    deptMap.set(task.department, deptEntry);

    const catEntry = catMap.get(task.category) ?? { completed: 0, notCompleted: 0 };
    if (task.status === 'Completed') catEntry.completed += 1;
    else catEntry.notCompleted += 1;
    catMap.set(task.category, catEntry);

    if (isTaskOverdue(task)) {
      overdueCount += 1;
    }

    const buckets = getTaskWeekBuckets(task);
    if (buckets.overdueLastWeek) overdueLastWeek += 1;
    if (buckets.ongoingThisWeek) ongoingThisWeek += 1;
    if (buckets.upcomingNextWeek) upcomingNextWeek += 1;

    if (buckets.dueToday) {
      dueTodayCount += 1;
      if (dueTodayPriorityCounts[task.priority] !== undefined) {
        dueTodayPriorityCounts[task.priority] += 1;
      }
      dueTodayStatusCounts[task.status] = (dueTodayStatusCounts[task.status] ?? 0) + 1;
      dueTodayCategoryCounts[task.category] = (dueTodayCategoryCounts[task.category] ?? 0) + 1;
    }
  }

  const priorityData = TASK_PRIORITIES.map((name) => ({
    name,
    value: priorityCounts[name] ?? 0,
    color: PRIORITY_COLORS[name],
  })).filter((item) => item.value > 0);

  const statusData = Object.entries(statusCounts).map(([name, count]) => ({
    name,
    tasks: count,
  }));

  const departmentData: BreakdownBarItem[] = Array.from(deptMap.entries()).map(([name, counts]) => ({
    name,
    completed: counts.completed,
    notCompleted: counts.notCompleted,
    total: counts.completed + counts.notCompleted,
  }));

  const categoryData: BreakdownBarItem[] = Array.from(catMap.entries()).map(([name, counts]) => ({
    name,
    completed: counts.completed,
    notCompleted: counts.notCompleted,
    total: counts.completed + counts.notCompleted,
  }));

  // Last 7 days trend
  const today = getTodayMidnight();
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const completedOnDay = tasks.filter(
      (t) => t.status === 'Completed' && toISODateOnly(t.completed_at || t.due_date || t.created_at) === iso
    ).length;
    const dueOnDay = tasks.filter((t) => t.due_date === iso).length;
    return {
      day: String(d.getDate()).padStart(2, '0'),
      tasks: completedOnDay,
      completed: completedOnDay,
      due: dueOnDay,
    };
  });

  // Monthly breakdown for selected month & year
  const monthIdx = Math.max(0, MONTH_NAMES.indexOf(month));
  const selectedYearNum = Number(year) || new Date().getFullYear();
  const daysInMonth = new Date(selectedYearNum, monthIdx + 1, 0).getDate();
  const monthPrefix = `${selectedYearNum}-${String(monthIdx + 1).padStart(2, '0')}`;

  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayIso = `${monthPrefix}-${String(dayNum).padStart(2, '0')}`;
    const dayTasks = tasks.filter(
      (t) =>
        t.due_date === dayIso ||
        (!t.due_date && toISODateOnly(t.created_at) === dayIso)
    );
    const completedOnDay = tasks.filter(
      (t) =>
        t.status === 'Completed' &&
        (toISODateOnly(t.completed_at) === dayIso || (!t.completed_at && t.due_date === dayIso))
    ).length;
    const total = dayTasks.length;
    const rate = total > 0 ? Math.round((completedOnDay / total) * 100) : 0;

    return {
      day: dayNum,
      label: `${SHORT_MONTHS[monthIdx]} ${String(dayNum).padStart(2, '0')}`,
      total,
      completed: completedOnDay,
      rate,
      tasks: completedOnDay,
    };
  });

  // Yearly breakdown for selected year
  const yearlyData = MONTH_NAMES.map((monthName, idx) => {
    const ymPrefix = `${selectedYearNum}-${String(idx + 1).padStart(2, '0')}`;
    const monthTasks = tasks.filter(
      (t) =>
        t.due_date.startsWith(ymPrefix) ||
        (!t.due_date && toISODateOnly(t.created_at).startsWith(ymPrefix))
    );
    const completedInMonth = tasks.filter(
      (t) =>
        t.status === 'Completed' &&
        (toISODateOnly(t.completed_at).startsWith(ymPrefix) ||
          (!t.completed_at && t.due_date.startsWith(ymPrefix)))
    ).length;
    const total = monthTasks.length;
    const rate = total > 0 ? Math.round((completedInMonth / total) * 100) : 0;
    return {
      month: monthName,
      shortMonth: SHORT_MONTHS[idx],
      total,
      completed: completedInMonth,
      rate,
      tasks: completedInMonth,
    };
  });

  const priorityRank: Record<string, number> = {
    Critical: 0,
    'Very High': 1,
    High: 2,
    Medium: 3,
    Low: 4,
  };

  const activeTasks = tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
  const myActiveTasks = currentUserId
    ? activeTasks.filter((t) => t.assignee_id === currentUserId)
    : [];
  const focusPool = myActiveTasks.length > 0 ? myActiveTasks : activeTasks;

  const focusTasks = focusPool
    .toSorted((a, b) => {
      const aOverdue = isTaskOverdue(a) ? 0 : 1;
      const bOverdue = isTaskOverdue(b) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aDays = computeDaysLeft(a.due_date) ?? 9999;
      const bDays = computeDaysLeft(b.due_date) ?? 9999;
      if (aDays !== bDays) return aDays - bDays;
      return (priorityRank[a.priority] ?? 5) - (priorityRank[b.priority] ?? 5);
    })
    .slice(0, 5);

  return {
    totalTasks,
    completedTasks,
    completionRate,
    openTasks,
    closedTasks,
    dueTodayCount,
    overdueCount,
    overdueLastWeek,
    ongoingThisWeek,
    upcomingNextWeek,
    dueTodayByPriority: [
      { label: 'Critical', count: dueTodayPriorityCounts.Critical, tone: 'danger' },
      { label: 'Very High', count: dueTodayPriorityCounts['Very High'], tone: 'urgent' },
      { label: 'High', count: dueTodayPriorityCounts.High, tone: 'warning' },
      { label: 'Medium', count: dueTodayPriorityCounts.Medium, tone: 'info' },
      { label: 'Low', count: dueTodayPriorityCounts.Low, tone: 'success' },
    ],
    dueTodayByStatus: Object.entries(dueTodayStatusCounts).map(([label, count]) => ({ label, count })),
    dueTodayByCategory: Object.entries(dueTodayCategoryCounts).map(([label, count]) => ({ label, count })),
    priorityData,
    statusData,
    departmentData,
    categoryData,
    last7DaysData,
    monthlyData,
    yearlyData,
    focusTasks,
  };
}
