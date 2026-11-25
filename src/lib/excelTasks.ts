import {
  EmployeeProfile,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskInput,
  TaskRecord,
  computeDaysLeft,
  toISODateOnly,
} from '@/lib/types/task';

export async function exportTasksToExcel(
  tasks: TaskRecord[],
  filename = 'tasks-board.xlsx'
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = tasks.map((t) => {
    const daysLeft = computeDaysLeft(t.due_date);
    return {
      'Task ID': t.task_code,
      'Person Assigned': t.assignee_name,
      Task: t.title,
      'Task Description': t.description,
      Category: t.category,
      Priority: t.priority,
      Department: t.department,
      'Start Date': t.start_date,
      'Due Date': t.due_date,
      'Days Left': daysLeft ?? '',
      'Assigned On': t.assigned_on,
      Status: t.status,
      'Progress (%)': t.progress,
      Remarks: t.remarks,
      Notes: t.notes,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks Board');
  XLSX.writeFile(workbook, filename);
}

export async function exportTasksToCsv(
  tasks: TaskRecord[],
  filename = 'tasks-board.csv'
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = tasks.map((t) => ({
    'Task ID': t.task_code,
    'Person Assigned': t.assignee_name,
    Task: t.title,
    'Task Description': t.description,
    Category: t.category,
    Priority: t.priority,
    Department: t.department,
    'Start Date': t.start_date,
    'Due Date': t.due_date,
    'Assigned On': t.assigned_on,
    Status: t.status,
    'Progress (%)': t.progress,
    Remarks: t.remarks,
    Notes: t.notes,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseSpreadsheetDate(
  raw: unknown,
  parseDateCode: (v: number) => { y: number; m: number; d: number } | null
): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const parsed = parseDateCode(raw);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(
        parsed.d
      ).padStart(2, '0')}`;
    }
  }
  const iso = toISODateOnly(String(raw));
  return iso || null;
}

function normalizeHeader(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function parseTasksFromSpreadsheet(
  file: File,
  employees: EmployeeProfile[]
): Promise<TaskInput[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName =
    workbook.SheetNames.find((n) => n.toLowerCase().includes('task')) ?? workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rawObjects = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  const employeeByName = new Map<string, string>();
  for (const emp of employees) {
    employeeByName.set(emp.name.trim().toLowerCase(), emp.id);
    if (emp.email) employeeByName.set(emp.email.trim().toLowerCase(), emp.id);
  }

  const results: TaskInput[] = [];

  for (const row of rawObjects) {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeHeader(k)] = v;
    }

    const titleRaw = normalized.task || normalized.title || normalized.taskdescription || '';
    const title = String(titleRaw).trim();
    if (!title) continue;

    const descRaw =
      normalized.taskdescription && normalized.task
        ? normalized.taskdescription
        : normalized.description;
    const personRaw = String(normalized.personassigned || normalized.assignee || '')
      .trim()
      .toLowerCase();
    const assigneeId = personRaw ? employeeByName.get(personRaw) ?? null : null;

    const statusRaw = String(normalized.status || 'Not Started').trim();
    const matchedStatus =
      TASK_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) ?? 'Not Started';

    const priorityRaw = String(normalized.priority || 'Medium').trim();
    const matchedPriority =
      TASK_PRIORITIES.find((p) => p.toLowerCase() === priorityRaw.toLowerCase()) ?? 'Medium';

    const progressNum = Number(normalized.progress ?? normalized.progresspercent ?? 0);

    results.push({
      title,
      description: String(descRaw ?? '').trim(),
      status: matchedStatus,
      priority: matchedPriority,
      category: String(normalized.category || 'Project').trim() || 'Project',
      department: String(normalized.department || 'Operations').trim() || 'Operations',
      assignee_id: assigneeId,
      start_date: parseSpreadsheetDate(normalized.startdate, XLSX.SSF.parse_date_code),
      due_date: parseSpreadsheetDate(normalized.duedate, XLSX.SSF.parse_date_code),
      assigned_on: parseSpreadsheetDate(normalized.assignedon, XLSX.SSF.parse_date_code),
      progress: Number.isFinite(progressNum)
        ? Math.max(0, Math.min(100, Math.round(progressNum)))
        : 0,
      remarks: String(normalized.remarks || 'Open').trim() || 'Open',
      notes: String(normalized.notes || '').trim(),
    });
  }

  return results;
}
