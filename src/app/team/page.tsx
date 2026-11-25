'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Edit3,
  Eye,
  Mail,
  Phone,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { getTeamWithWorkload } from '@/lib/api/team';
import { getWorkspaceContext } from '@/lib/api/tasks';
import { DEFAULT_DEPARTMENTS } from '@/lib/types/task';
import {
  EmployeeDetailedProfile,
  EmployeeWorkloadSummary,
} from '@/lib/types/workspace';
import SortableTable, { TableColumn } from '@/components/ui/SortableTable';
import EmployeeWorkloadModal from '@/components/team/EmployeeWorkloadModal';
import EmployeeEditModal from '@/components/team/EmployeeEditModal';
import { useToast } from '@/components/ui/ToastProvider';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TeamPage() {
  const [summaries, setSummaries] = useState<EmployeeWorkloadSummary[]>([]);
  const [departments, setDepartments] = useState<string[]>([...DEFAULT_DEPARTMENTS]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetailedProfile | null>(null);
  const { showToast } = useToast();

  const refreshTeam = useCallback(async () => {
    const [teamRes, ctx] = await Promise.all([getTeamWithWorkload(), getWorkspaceContext()]);
    setSummaries(teamRes.summaries);
    setCurrentUserRole(teamRes.currentUserRole);
    if (ctx.departments.length > 0) {
      setDepartments(ctx.departments);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const [teamRes, ctx] = await Promise.all([getTeamWithWorkload(), getWorkspaceContext()]);
      if (!active) return;
      setSummaries(teamRes.summaries);
      setCurrentUserRole(teamRes.currentUserRole);
      if (ctx.departments.length > 0) {
        setDepartments(ctx.departments);
      }
      setLoading(false);
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const isAdminOrAbove =
    currentUserRole === 'admin' || currentUserRole === 'superadmin';

  const departmentChoices = useMemo(() => {
    const fromTeam = summaries
      .map((s) => s.employee.department)
      .filter((d): d is string => Boolean(d));
    return Array.from(new Set([...departments, ...fromTeam]));
  }, [departments, summaries]);

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summaries.filter((item) => {
      if (deptFilter !== 'all' && (item.employee.department || 'Unassigned') !== deptFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        item.employee.name,
        item.employee.email,
        item.employee.emp_id,
        item.employee.department,
        item.employee.position,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [summaries, deptFilter, searchQuery]);

  const selectedSummary = useMemo(
    () => summaries.find((s) => s.employee.id === selectedEmployeeId) ?? null,
    [summaries, selectedEmployeeId]
  );

  const handleCopyPhone = async (emp: EmployeeDetailedProfile) => {
    const phone = emp.phone?.trim();
    if (!phone) {
      showToast({
        title: `No phone number listed for ${emp.name}`,
        tone: 'info',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(phone);
      showToast({
        title: 'Phone number copied',
        description: `${emp.name}: ${phone}`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: `${emp.name}'s phone: ${phone}`,
        tone: 'info',
      });
    }
  };

  const totalActive = summaries.reduce((acc, s) => acc + s.activeTasks, 0);
  const totalOverdue = summaries.reduce((acc, s) => acc + s.overdueTasks, 0);
  const avgCompletion =
    summaries.length > 0
      ? Math.round(
          summaries.reduce((acc, s) => acc + s.completionRate, 0) / summaries.length
        )
      : 0;

  const columns: TableColumn<EmployeeWorkloadSummary>[] = [
    {
      key: 'name',
      label: 'Employee',
      sortable: true,
      isRowHeader: true,
      getSortValue: (r) => r.employee.name,
      renderCell: (item) => (
        <button
          type="button"
          onClick={() => setSelectedEmployeeId(item.employee.id)}
          className="employee-cell"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            textAlign: 'start',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <span className="avatar-circle" aria-hidden="true">
            {getInitials(item.employee.name)}
          </span>
          <div>
            <div className="employee-name">{item.employee.name}</div>
            <div className="employee-role">
              {item.employee.position || 'Team Member'}
            </div>
          </div>
        </button>
      ),
    },
    {
      key: 'emp_id',
      label: 'Employee ID',
      sortable: true,
      getSortValue: (r) => r.employee.emp_id || '',
      renderCell: (item) => (
        <span className="font-mono text-secondary">{item.employee.emp_id || '—'}</span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      getSortValue: (r) => r.employee.department || '',
      renderCell: (item) => (
        <span className="badge badge--neutral">
          {item.employee.department || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'workload',
      label: 'Workload',
      sortable: true,
      getSortValue: (r) => r.activeTasks,
      renderCell: (item) => (
        <div className="pill-cluster">
          <span className="badge badge--info font-mono">{item.activeTasks} active</span>
          <span className="badge badge--success font-mono">
            {item.completedTasks} done
          </span>
          {item.overdueTasks > 0 && (
            <span className="badge badge--danger font-mono">
              {item.overdueTasks} overdue
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'completion',
      label: 'Completion',
      sortable: true,
      getSortValue: (r) => r.completionRate,
      renderCell: (item) => (
        <div style={{ minInlineSize: '7.5rem' }}>
          <div className="meter-row-head" style={{ marginBlockEnd: '0.25rem' }}>
            <span className="font-mono">{item.completionRate}%</span>
            <span className="text-secondary font-mono" style={{ fontSize: '0.75rem' }}>
              ({item.totalTasks})
            </span>
          </div>
          <progress
            className="native-progress"
            value={item.completionRate}
            max={100}
            aria-label={`${item.employee.name} completion rate ${item.completionRate}%`}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      renderCell: (item) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSelectedEmployeeId(item.employee.id)}
            aria-label={`Inspect workload for ${item.employee.name}`}
            title="Inspect workload"
          >
            <Eye size={15} aria-hidden="true" />
          </button>
          {item.employee.email ? (
            <a
              href={`mailto:${item.employee.email}`}
              className="btn-icon"
              aria-label={`Email ${item.employee.name}`}
              title={`Email ${item.employee.email}`}
            >
              <Mail size={15} aria-hidden="true" />
            </a>
          ) : null}
          <button
            type="button"
            className="btn-icon"
            onClick={() => void handleCopyPhone(item.employee)}
            aria-label={`View or copy phone for ${item.employee.name}`}
            title="Copy phone"
          >
            <Phone size={15} aria-hidden="true" />
          </button>
          {isAdminOrAbove && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setEditingEmployee(item.employee)}
              aria-label={`Edit ${item.employee.name}`}
              title="Edit employee profile"
            >
              <Edit3 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-stack">
      <div className="section-header">
        <div>
          <h2 className="section-title">Team Data Sheet & Workload</h2>
          <p className="section-subtitle">
            Live employee capacity, completion metrics, assigned tasks, and contact actions.
          </p>
        </div>
        {isAdminOrAbove && (
          <Link href="/admin/users" className="btn btn-primary">
            <UserPlus size={16} aria-hidden="true" />
            <span>Add Employee</span>
          </Link>
        )}
      </div>

      {/* Team Summary KPIs */}
      <div className="dashboard-kpi-grid">
        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Team Members</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <Users size={16} />
            </span>
          </div>
          {loading ? (
            <>
              <div className="skeleton-bar" style={{ inlineSize: '3rem', blockSize: '1.875rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '55%', blockSize: '0.75rem' }} />
            </>
          ) : (
            <>
              <div className="kpi-value font-mono">{summaries.length}</div>
              <div className="kpi-meta">{departmentChoices.length} departments</div>
            </>
          )}
        </article>

        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Active Workload</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <Briefcase size={16} />
            </span>
          </div>
          {loading ? (
            <>
              <div className="skeleton-bar" style={{ inlineSize: '3rem', blockSize: '1.875rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '60%', blockSize: '0.75rem' }} />
            </>
          ) : (
            <>
              <div className="kpi-value font-mono">{totalActive}</div>
              <div className="kpi-meta">In-progress &amp; open tasks</div>
            </>
          )}
        </article>

        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Overdue Load</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <AlertTriangle size={16} />
            </span>
          </div>
          {loading ? (
            <>
              <div className="skeleton-bar" style={{ inlineSize: '3rem', blockSize: '1.875rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '60%', blockSize: '0.75rem' }} />
            </>
          ) : (
            <>
              <div className="kpi-value font-mono">{totalOverdue}</div>
              <div className="kpi-meta">Across assigned owners</div>
            </>
          )}
        </article>

        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Avg Completion</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <CheckCircle2 size={16} />
            </span>
          </div>
          {loading ? (
            <>
              <div className="skeleton-bar" style={{ inlineSize: '3.5rem', blockSize: '1.875rem' }} />
              <div className="skeleton-bar" style={{ inlineSize: '55%', blockSize: '0.75rem' }} />
            </>
          ) : (
            <>
              <div className="kpi-value font-mono">{avgCompletion}%</div>
              <div className="kpi-meta">Team-wide delivery rate</div>
            </>
          )}
        </article>
      </div>

      {/* Filters Toolbar */}
      <div className="surface-card">
        <div className="tasks-toolbar">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flex: '1 1 16rem',
            }}
          >
            <Search size={16} className="text-secondary" aria-hidden="true" />
            <label htmlFor="team-search" className="visually-hidden">
              Search team members
            </label>
            <input
              id="team-search"
              type="search"
              className="field-input"
              placeholder="Search by name, ID, role, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="team-dept-filter" className="field-label">
              Department
            </label>
            <select
              id="team-dept-filter"
              className="field-select field-select--compact"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departmentChoices.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <article className="surface-card surface-card--flush">
        <SortableTable
          caption="Company team directory and workload summary"
          columns={columns}
          rows={filteredSummaries}
          getRowKey={(item) => item.employee.id}
          responsiveStack
          emptyMessage={
            loading ? 'Loading team workload data...' : 'No matching team members found.'
          }
        />
      </article>

      <EmployeeWorkloadModal
        summary={selectedSummary}
        canViewSensitiveHr={isAdminOrAbove}
        onClose={() => setSelectedEmployeeId(null)}
        onEditEmployee={(emp) => {
          setSelectedEmployeeId(null);
          setEditingEmployee(emp);
        }}
      />

      <EmployeeEditModal
        employee={editingEmployee}
        departments={departmentChoices}
        onClose={() => setEditingEmployee(null)}
        onSaved={refreshTeam}
      />
    </div>
  );
}
