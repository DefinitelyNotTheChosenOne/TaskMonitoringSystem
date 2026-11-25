'use client';

import React from 'react';
import { Briefcase, Calendar, CheckCircle2, Clock, Edit3, Mail, Phone, Shield, User } from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import { isTaskOverdue } from '@/lib/types/task';
import { EmployeeDetailedProfile, EmployeeWorkloadSummary } from '@/lib/types/workspace';

interface EmployeeWorkloadModalProps {
  summary: EmployeeWorkloadSummary | null;
  canViewSensitiveHr: boolean;
  onClose: () => void;
  onEditEmployee: (employee: EmployeeDetailedProfile) => void;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Completed':
      return 'badge--success';
    case 'Overdue':
      return 'badge--danger';
    case 'In Review':
    case 'Active':
    case 'In Progress':
      return 'badge--info';
    case 'On Hold':
      return 'badge--warning';
    default:
      return 'badge--neutral';
  }
}

export default function EmployeeWorkloadModal({
  summary,
  canViewSensitiveHr,
  onClose,
  onEditEmployee,
}: EmployeeWorkloadModalProps) {
  if (!summary) {
    return (
      <ModalDialog open={false} onClose={onClose} title="Employee Workload" size="lg">
        <div />
      </ModalDialog>
    );
  }

  const { employee, totalTasks, activeTasks, completedTasks, overdueTasks, completionRate, tasks } =
    summary;

  return (
    <ModalDialog
      open={Boolean(summary)}
      onClose={onClose}
      title={employee.name}
      subtitle={`${employee.position || 'Team Member'} · ${employee.department || 'Unassigned'} · ${employee.emp_id || 'No ID'}`}
      size="lg"
      footer={
        <>
          {canViewSensitiveHr && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onEditEmployee(employee)}
            >
              <Edit3 size={15} aria-hidden="true" />
              <span>Edit Profile & HR</span>
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="detail-stack">
        {/* KPI Overview */}
        <div className="detail-meta-grid">
          <div className="muted-well">
            <div className="tasks-summary-label">Total Assigned</div>
            <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {totalTasks}
            </div>
            <span className="card-subtitle font-mono">{activeTasks} active</span>
          </div>

          <div className="muted-well">
            <div className="tasks-summary-label">Completed</div>
            <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {completedTasks}
            </div>
            <div style={{ marginBlockStart: '0.375rem' }}>
              <progress
                className="native-progress"
                value={completionRate}
                max={100}
                aria-label={`${completionRate}% completion rate`}
              />
              <span className="card-subtitle font-mono">{completionRate}% done</span>
            </div>
          </div>

          <div className="muted-well">
            <div className="tasks-summary-label">Overdue</div>
            <div
              className="font-mono"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: overdueTasks > 0 ? 'var(--status-danger)' : 'var(--text-primary)',
              }}
            >
              {overdueTasks}
            </div>
            <span className="card-subtitle">
              Status: {employee.employee_status || 'Active'}
            </span>
          </div>
        </div>

        {/* Directory Details */}
        <section className="detail-section" aria-labelledby="emp-directory-heading">
          <div className="detail-section-head">
            <h3 id="emp-directory-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} aria-hidden="true" />
              <span>Employment & Contact</span>
            </h3>
          </div>
          <div className="detail-meta-grid">
            <div className="muted-well">
              <div className="tasks-summary-label">Email</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <Mail size={14} aria-hidden="true" />
                <span>{employee.email || 'Not provided'}</span>
              </div>
            </div>
            <div className="muted-well">
              <div className="tasks-summary-label">Phone</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <Phone size={14} aria-hidden="true" />
                <span className="font-mono">{employee.phone || 'Not provided'}</span>
              </div>
            </div>
            <div className="muted-well">
              <div className="tasks-summary-label">Date of Hire</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <Calendar size={14} aria-hidden="true" />
                <span className="font-mono">{employee.date_of_hire || 'Not set'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Admin-Only Confidential HR Section */}
        {canViewSensitiveHr && (
          <section className="detail-section" aria-labelledby="emp-hr-heading">
            <div className="detail-section-head">
              <h3 id="emp-hr-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} aria-hidden="true" />
                <span>Confidential HR Details (Admin Only)</span>
              </h3>
            </div>
            <div className="detail-meta-grid">
              <div className="muted-well">
                <div className="tasks-summary-label">Date of Birth</div>
                <span className="font-mono">{employee.date_of_birth || '—'}</span>
              </div>
              <div className="muted-well">
                <div className="tasks-summary-label">TIN / Tax ID</div>
                <span className="font-mono">{employee.tin || '—'}</span>
              </div>
              <div className="muted-well">
                <div className="tasks-summary-label">Emergency Contact</div>
                <span className="card-subtitle">
                  {employee.emergency_contact_name || '—'}{' '}
                  {employee.emergency_contact_number ? `(${employee.emergency_contact_number})` : ''}
                </span>
              </div>
            </div>
            {employee.home_address && (
              <div className="muted-well">
                <div className="tasks-summary-label">Home Address</div>
                <span className="card-subtitle">{employee.home_address}</span>
              </div>
            )}
          </section>
        )}

        {/* Assigned Tasks List */}
        <section className="detail-section" aria-labelledby="emp-tasks-heading">
          <div className="detail-section-head">
            <h3 id="emp-tasks-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={16} aria-hidden="true" />
              <span>Assigned Tasks ({tasks.length})</span>
            </h3>
          </div>

          {tasks.length === 0 ? (
            <p className="card-subtitle">No tasks currently assigned to {employee.name}.</p>
          ) : (
            <div className="table-region">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Task</th>
                    <th scope="col">Status</th>
                    <th scope="col">Due Date</th>
                    <th scope="col">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const overdue = isTaskOverdue(t);
                    return (
                      <tr key={t.id}>
                        <th scope="row" className="table-row-header">
                          <div>{t.title}</div>
                          <div className="text-secondary font-mono" style={{ fontSize: '0.75rem' }}>
                            {t.task_code} · {t.category}
                          </div>
                        </th>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                            {overdue && t.status !== 'Overdue' ? `${t.status} (Overdue)` : t.status}
                          </span>
                        </td>
                        <td className="font-mono">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {t.status === 'Completed' ? (
                              <CheckCircle2 size={14} aria-hidden="true" />
                            ) : (
                              <Clock size={14} aria-hidden="true" />
                            )}
                            {t.due_date || '—'}
                          </span>
                        </td>
                        <td className="font-mono">{t.progress}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </ModalDialog>
  );
}
