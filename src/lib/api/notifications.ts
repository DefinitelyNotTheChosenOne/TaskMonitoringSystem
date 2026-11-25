import { createClient } from '@/utils/supabase/client';
import { NotificationAlert } from '@/lib/types/workspace';
import { computeDaysLeft, isTaskOverdue, toISODateOnly } from '@/lib/types/task';

export async function createUserNotification(params: {
  recipientId: string;
  companyId?: string | null;
  title: string;
  body?: string;
  linkHref?: string;
}): Promise<void> {
  if (!params.recipientId) return;

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id === params.recipientId) return;

    await supabase.from('notifications').insert({
      recipient_id: params.recipientId,
      ...(params.companyId ? { company_id: params.companyId } : {}),
      title: params.title,
      body: params.body ?? '',
      link_href: params.linkHref ?? '/tasks',
    });
  } catch {
    // Best-effort notification: ignore schema or RLS errors so task mutations succeed
  }
}

export async function fetchNotificationsAndAlerts(): Promise<NotificationAlert[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  if (!user) return [];

  const [{ data: notifRows, error: notifErr }, { data: taskRows }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, assignee_id')
      .neq('status', 'Completed')
      .neq('status', 'Cancelled'),
  ]);

  const alerts: NotificationAlert[] = [];

  if (!notifErr && notifRows) {
    for (const row of notifRows) {
      alerts.push({
        id: String(row.id),
        source: 'db',
        title: String(row.title ?? 'Notification'),
        body: String(row.body ?? ''),
        linkHref: String(row.link_href ?? '/tasks'),
        isRead: Boolean(row.is_read),
        createdAt: String(row.created_at ?? ''),
      });
    }
  }

  const relevantTasks = (taskRows ?? []).filter(
    (t) => t.assignee_id === user.id || !t.assignee_id
  );

  for (const t of relevantTasks) {
    const dueIso = toISODateOnly(t.due_date);
    const daysLeft = computeDaysLeft(dueIso);
    const overdue = isTaskOverdue({ status: String(t.status ?? ''), due_date: dueIso });
    if (overdue) {
      alerts.push({
        id: `overdue-${t.id}`,
        source: 'overdue',
        title: `Overdue: ${t.title}`,
        body: dueIso ? `Was due ${dueIso}` : 'Marked overdue',
        linkHref: '/tasks?filter=overdue',
        isRead: false,
        createdAt: dueIso || new Date().toISOString(),
      });
    } else if (daysLeft === 0) {
      alerts.push({
        id: `due-today-${t.id}`,
        source: 'due_today',
        title: `Due today: ${t.title}`,
        body: 'Scheduled for completion today',
        linkHref: '/tasks?filter=today',
        isRead: false,
        createdAt: dueIso,
      });
    } else if (daysLeft !== null && daysLeft >= 1 && daysLeft <= 2) {
      alerts.push({
        id: `upcoming-${t.id}`,
        source: 'upcoming',
        title: `Due in ${daysLeft}d: ${t.title}`,
        body: dueIso ? `Due ${dueIso}` : 'Approaching deadline',
        linkHref: '/tasks?filter=upcoming',
        isRead: false,
        createdAt: dueIso,
      });
    }
  }

  return alerts.slice(0, 20);
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllDbNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);
}
