'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Clock,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/api/tasks';
import { InitialDashboardData } from '@/lib/api/dashboardServer';
import {
  CompanyProfile,
  DashboardAnalytics,
  computeDaysLeft,
  isSafeLogoUrl,
  isTaskOverdue,
} from '@/lib/types/task';
import { useWorkspacePeriod } from '@/components/WorkspacePeriodProvider';

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
};

const emptySubscribe = () => () => {};

function DonutSkeleton() {
  return (
    <div className="skeleton-donut-wrap" aria-hidden="true">
      <div className="skeleton-circle" style={{ inlineSize: '9.75rem', blockSize: '9.75rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '0.75rem' }} />
        <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '0.75rem' }} />
        <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '0.75rem' }} />
      </div>
    </div>
  );
}

function BarsSkeleton({ rows = 5 }: { rows?: number }) {
  const widths = ['78%', '62%', '48%', '86%', '54%', '70%'];
  return (
    <div className="skeleton-bars-stack" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton-bars-row">
          <div className="skeleton-bar" style={{ inlineSize: '4.75rem', blockSize: '0.75rem' }} />
          <div
            className="skeleton-bar"
            style={{ inlineSize: widths[idx % widths.length], blockSize: '0.875rem' }}
          />
        </div>
      ))}
    </div>
  );
}

function LinesSkeleton() {
  return (
    <div className="skeleton-lines-box" aria-hidden="true">
      <div className="skeleton-bar" style={{ inlineSize: '100%', blockSize: '100%' }} />
    </div>
  );
}

export default function DashboardClient({
  initialData,
}: {
  initialData: InitialDashboardData;
}) {
  const { month, year, todayFormatted, todayWeekday } = useWorkspacePeriod();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [activeChart, setActiveChart] = useState<'department' | 'category'>('department');
  const [company, setCompany] = useState<CompanyProfile>(initialData.company);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(initialData.analytics);
  const [schemaReady, setSchemaReady] = useState(initialData.schemaReady);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialData.loadError);
  const [loadedPeriod, setLoadedPeriod] = useState({
    month: initialData.initialMonth,
    year: initialData.initialYear,
  });

  const loadedPeriodRef = useRef({
    month: initialData.initialMonth,
    year: initialData.initialYear,
  });

  useEffect(() => {
    if (
      month === loadedPeriodRef.current.month &&
      year === loadedPeriodRef.current.year
    ) {
      return;
    }

    let active = true;
    async function loadData() {
      const stats = await getDashboardStats(month, year);
      if (!active) return;
      if (stats) {
        setCompany(stats.company);
        setAnalytics(stats.analytics);
        setSchemaReady(stats.schemaReady);
        setLoadError(stats.loadError ?? null);
      }
      loadedPeriodRef.current = { month, year };
      setLoadedPeriod({ month, year });
    }
    void loadData();

    return () => {
      active = false;
    };
  }, [month, year]);

  const isRefreshing = loadedPeriod.month !== month || loadedPeriod.year !== year;
  const chartsReady = mounted && !isRefreshing;

  return (
    <div className="dashboard-stack">
      {!schemaReady && !bannerDismissed && (
        <div className="info-banner" role="status">
          <div className="info-banner-copy">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              Run <code>supabase_migration.sql</code> in Supabase SQL Editor to enable full
              company branding, categories, departments, and completion history.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setBannerDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <div className="form-alert form-alert--error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            Could not load tasks ({loadError}).
            {loadError.toLowerCase().includes('permission denied')
              ? ' Run the updated supabase_migration.sql (Section 12 Grants) in Supabase SQL Editor and refresh.'
              : ''}
          </span>
        </div>
      )}

      {/* KPI Overview Strip (Single-Destination Clickable Cards) */}
      <section aria-label="Task summary metrics" className="dashboard-kpi-grid">
        <Link href="/tasks" className="kpi-link">
          <article className="surface-card surface-card--compact kpi-card">
            <div className="kpi-card-head">
              <span className="kpi-label">Total Tasks</span>
              <span className="kpi-icon-pill" aria-hidden="true">
                <CheckSquare size={16} />
              </span>
            </div>
            {isRefreshing ? (
              <>
                <div className="skeleton-bar" style={{ inlineSize: '3.25rem', blockSize: '2rem' }} />
                <div className="skeleton-bar" style={{ inlineSize: '65%', blockSize: '0.75rem' }} />
              </>
            ) : (
              <>
                <div className="kpi-value font-mono">{analytics.totalTasks}</div>
                <span className="kpi-meta">{analytics.completionRate}% completed overall</span>
              </>
            )}
          </article>
        </Link>

        <Link href="/tasks?filter=overdue" className="kpi-link">
          <article className="surface-card surface-card--compact kpi-card">
            <div className="kpi-card-head">
              <span className="kpi-label">Overdue</span>
              <span className="kpi-icon-pill" style={{ color: 'var(--status-danger)' }} aria-hidden="true">
                <AlertTriangle size={16} />
              </span>
            </div>
            {isRefreshing ? (
              <>
                <div className="skeleton-bar" style={{ inlineSize: '3.25rem', blockSize: '2rem' }} />
                <div className="skeleton-bar" style={{ inlineSize: '55%', blockSize: '0.75rem' }} />
              </>
            ) : (
              <>
                <div className="kpi-value font-mono">{analytics.overdueCount}</div>
                <span className="kpi-meta">{analytics.overdueLastWeek} due last week</span>
              </>
            )}
          </article>
        </Link>

        <Link href="/tasks?filter=ongoing" className="kpi-link">
          <article className="surface-card surface-card--compact kpi-card">
            <div className="kpi-card-head">
              <span className="kpi-label">Ongoing</span>
              <span className="kpi-icon-pill" style={{ color: 'var(--status-info)' }} aria-hidden="true">
                <Clock size={16} />
              </span>
            </div>
            {isRefreshing ? (
              <>
                <div className="skeleton-bar" style={{ inlineSize: '3.25rem', blockSize: '2rem' }} />
                <div className="skeleton-bar" style={{ inlineSize: '70%', blockSize: '0.75rem' }} />
              </>
            ) : (
              <>
                <div className="kpi-value font-mono">{analytics.ongoingThisWeek}</div>
                <span className="kpi-meta">Due this week (Mon–Sun)</span>
              </>
            )}
          </article>
        </Link>

        <Link href="/tasks?filter=upcoming" className="kpi-link">
          <article className="surface-card surface-card--compact kpi-card">
            <div className="kpi-card-head">
              <span className="kpi-label">Upcoming</span>
              <span className="kpi-icon-pill" style={{ color: 'var(--status-success)' }} aria-hidden="true">
                <CalendarClock size={16} />
              </span>
            </div>
            {isRefreshing ? (
              <>
                <div className="skeleton-bar" style={{ inlineSize: '3.25rem', blockSize: '2rem' }} />
                <div className="skeleton-bar" style={{ inlineSize: '70%', blockSize: '0.75rem' }} />
              </>
            ) : (
              <>
                <div className="kpi-value font-mono">{analytics.upcomingNextWeek}</div>
                <span className="kpi-meta">Due next week (Mon–Sun)</span>
              </>
            )}
          </article>
        </Link>
      </section>

      {/* Main 12-column Live Analytics Grid */}
      <div className="dashboard-main-grid">
        {/* Company Overview & Current Date */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Company Information</h2>
            <span className="badge badge--accent">
              <CalendarDays size={13} aria-hidden="true" />
              <span>{todayFormatted}</span>
            </span>
          </div>
          <div className="company-card-body">
            <div className="company-identity">
              {isSafeLogoUrl(company.logo_url) && failedLogoUrl !== company.logo_url ? (
                <div className="company-logo-badge">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.logo_url!}
                    alt={`${company.name} logo`}
                    width={56}
                    height={56}
                    className="company-logo-img"
                    onError={() => setFailedLogoUrl(company.logo_url ?? null)}
                  />
                </div>
              ) : (
                <div className="company-logo-badge" aria-hidden="true">
                  <Building2 size={22} />
                </div>
              )}
              <div>
                <div className="company-name">{company.name}</div>
                <div className="company-tagline">{company.tagline}</div>
              </div>
            </div>
            <div>
              <div className="mission-label">Mission</div>
              <p className="muted-well card-subtitle">{company.mission}</p>
            </div>
            <div className="muted-well" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="mission-label">Today</div>
                <div className="company-name">{todayFormatted}</div>
                <div className="card-subtitle">{todayWeekday}</div>
              </div>
              <Link href="/tasks?filter=today" className="badge badge--info" style={{ textDecoration: 'none' }}>
                <span className="font-mono">{analytics.dueTodayCount} due today</span>
              </Link>
            </div>
          </div>
        </article>

        {/* Tasks By Priority Level */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Tasks by Priority Level</h2>
            <span className="card-subtitle">Live distribution</span>
          </div>
          <div className="chart-box">
            {!chartsReady ? (
              <DonutSkeleton />
            ) : analytics.priorityData.length === 0 ? (
              <div className="chart-empty">
                No tasks yet. Add tasks on Tasks Board.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.priorityData}
                      cx="50%"
                      cy="44%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {analytics.priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend
                      iconType="circle"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-label">
                  <div className="donut-center-value font-mono">{analytics.completionRate}%</div>
                  <div className="donut-center-caption">Completed</div>
                </div>
              </>
            )}
          </div>
        </article>

        {/* Focus & Urgent Deadlines */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Focus &amp; Urgent Deadlines</h2>
            <Link href="/tasks" className="btn btn-ghost btn-sm">
              <span>View all</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {isRefreshing ? (
            <BarsSkeleton rows={4} />
          ) : analytics.focusTasks.length === 0 ? (
            <div className="chart-empty">
              All caught up — no pending deadlines.
            </div>
          ) : (
            <div className="focus-list">
              {analytics.focusTasks.map((task) => {
                const daysLeft = computeDaysLeft(task.due_date);
                const overdue = isTaskOverdue(task);
                return (
                  <Link key={task.id} href="/tasks" className="focus-item">
                    <div className="focus-item-main">
                      <span className="focus-item-title">{task.title}</span>
                      <span className="card-subtitle font-mono">
                        {task.task_code} · {task.assignee_name}
                      </span>
                    </div>
                    <span className={`badge ${overdue ? 'badge--danger' : 'badge--warning'} font-mono`}>
                      {daysLeft === null
                        ? task.priority
                        : daysLeft < 0
                          ? `${Math.abs(daysLeft)}d late`
                          : daysLeft === 0
                            ? 'Today'
                            : `${daysLeft}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        {/* Tasks By Status */}
        <article className="surface-card col-span-6">
          <div className="card-header">
            <h2 className="card-title">Tasks by Status</h2>
            <span className="card-subtitle">All workflow states</span>
          </div>
          <div className="chart-box chart-box--tall">
            {!chartsReady ? (
              <BarsSkeleton rows={6} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.statusData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    width={92}
                  />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="tasks" name="Tasks" fill="var(--accent)" barSize={14} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Tasks By Department / Category */}
        <article className="surface-card col-span-6">
          <div className="card-header">
            <h2 className="card-title">
              Tasks by {activeChart === 'department' ? 'Department' : 'Category'}
            </h2>
            <div className="segmented-control" role="group" aria-label="Breakdown dimension">
              <button
                type="button"
                className="segmented-btn"
                aria-pressed={activeChart === 'department'}
                onClick={() => setActiveChart('department')}
              >
                Department
              </button>
              <button
                type="button"
                className="segmented-btn"
                aria-pressed={activeChart === 'category'}
                onClick={() => setActiveChart('category')}
              >
                Category
              </button>
            </div>
          </div>
          <div className="chart-box chart-box--tall">
            {!chartsReady ? (
              <BarsSkeleton rows={5} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeChart === 'department' ? analytics.departmentData : analytics.categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    width={92}
                  />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_STYLE} />
                  <Legend
                    iconType="circle"
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="var(--accent)"
                    barSize={10}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="notCompleted"
                    name="Not Completed"
                    fill="var(--chart-2)"
                    barSize={10}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Last 7 Days Performance */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Last 7 Days Completion</h2>
            <span className="badge badge--info">Live</span>
          </div>
          <div className="chart-box">
            {!chartsReady ? (
              <LinesSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.last7DaysData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Completed"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--accent)', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Monthly Performance */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Monthly Completion ({month})</h2>
            <span className="card-subtitle">Daily output</span>
          </div>
          <div className="chart-box">
            {!chartsReady ? (
              <LinesSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.monthlyData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Completed"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--surface)', stroke: 'var(--accent)', r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Yearly Performance */}
        <article className="surface-card col-span-4">
          <div className="card-header">
            <h2 className="card-title">Yearly Completion ({year})</h2>
            <span className="card-subtitle">Annual trajectory</span>
          </div>
          <div className="chart-box">
            {!chartsReady ? (
              <LinesSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.yearlyData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 8 }}
                >
                  <XAxis
                    dataKey="shortMonth"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Completed"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--surface)', stroke: 'var(--accent)', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
