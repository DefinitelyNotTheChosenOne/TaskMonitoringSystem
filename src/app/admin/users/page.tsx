'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  createEmployee,
  deleteCompanyUser,
  listCompanyUsers,
  resetCompanyUserPassword,
  updateCompanyUser,
} from './actions';
import { getWorkspaceContext } from '@/lib/api/tasks';
import { DEFAULT_DEPARTMENTS } from '@/lib/types/task';
import SortableTable, { TableColumn } from '@/components/ui/SortableTable';
import ModalDialog from '@/components/ui/ModalDialog';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';

interface CompanyUserRow {
  id: string;
  name: string;
  email: string | null;
  emp_id: string | null;
  department: string | null;
  position: string | null;
  role: string;
  employee_status: string | null;
}

function normalizeUserRow(raw: Record<string, unknown>): CompanyUserRow {
  return {
    id: String(raw.id),
    name: String(raw.name ?? 'Team Member'),
    email: raw.email ? String(raw.email) : null,
    emp_id: raw.emp_id ? String(raw.emp_id) : null,
    department: raw.department ? String(raw.department) : null,
    position: raw.position ? String(raw.position) : null,
    role: String(raw.role ?? 'employee'),
    employee_status: raw.employee_status ? String(raw.employee_status) : 'Active',
  };
}

function EditUserForm({
  user,
  departments,
  onClose,
  onSaved,
}: {
  user: CompanyUserRow;
  departments: readonly string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name);
  const [empId, setEmpId] = useState(user.emp_id ?? '');
  const [department, setDepartment] = useState(user.department ?? '');
  const [position, setPosition] = useState(user.position ?? '');
  const [employeeStatus, setEmployeeStatus] = useState(user.employee_status ?? 'Active');
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const res = await updateCompanyUser(formData);
    setSaving(false);

    if (res?.error) {
      showToast({ title: 'Could not update user', description: res.error, tone: 'danger' });
      return;
    }

    showToast({ title: res?.success ?? 'User updated', tone: 'success' });
    await onSaved();
    onClose();
  };

  const deptChoices = Array.from(
    new Set([...departments, ...(department ? [department] : [])].filter(Boolean))
  );

  return (
    <form action={handleSubmit} className="form-stack">
      <input type="hidden" name="id" value={user.id} />

      <div className="form-grid--2">
        <div className="field">
          <label htmlFor="edit-user-name" className="field-label">
            Full Name<span className="field-required" aria-hidden="true">*</span>
          </label>
          <input
            id="edit-user-name"
            name="name"
            type="text"
            required
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-user-emp-id" className="field-label">
            Employee ID
          </label>
          <input
            id="edit-user-emp-id"
            name="emp_id"
            type="text"
            className="field-input"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-user-dept" className="field-label">
            Department
          </label>
          <select
            id="edit-user-dept"
            name="department"
            className="field-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">Unassigned</option>
            {deptChoices.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="edit-user-position" className="field-label">
            Position
          </label>
          <input
            id="edit-user-position"
            name="position"
            type="text"
            className="field-input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-user-status" className="field-label">
            Status
          </label>
          <select
            id="edit-user-status"
            name="employee_status"
            className="field-select"
            value={employeeStatus}
            onChange={(e) => setEmployeeStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Probationary">Probationary</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="form-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({
  user,
  onClose,
}: {
  user: CompanyUserRow;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const res = await resetCompanyUserPassword(formData);
    setSaving(false);

    if (res?.error) {
      showToast({ title: 'Password reset failed', description: res.error, tone: 'danger' });
      return;
    }

    showToast({
      title: `Password reset for ${user.name}`,
      description: res?.success,
      tone: 'success',
    });
    onClose();
  };

  return (
    <form action={handleSubmit} className="form-stack">
      <input type="hidden" name="id" value={user.id} />

      <div className="field">
        <label htmlFor="reset-user-pw" className="field-label">
          New Password<span className="field-required" aria-hidden="true">*</span>
        </label>
        <div className="password-field">
          <input
            id="reset-user-pw"
            name="new_password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
            className="field-input"
            placeholder="Minimum 6 characters"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPw((prev) => !prev)}
            aria-label={showPw ? 'Hide new password' : 'Show new password'}
            aria-pressed={showPw}
          >
            {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="form-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}

export default function AdminUsersPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<CompanyUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [departments, setDepartments] = useState<string[]>([...DEFAULT_DEPARTMENTS]);
  const [editingUser, setEditingUser] = useState<CompanyUserRow | null>(null);
  const [resetUser, setResetUser] = useState<CompanyUserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<CompanyUserRow | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();

  const refreshUsers = useCallback(async () => {
    const [res, ctx] = await Promise.all([listCompanyUsers(), getWorkspaceContext()]);
    setUsers((res.users ?? []).map((u) => normalizeUserRow(u)));
    if (ctx.departments.length > 0) {
      setDepartments(ctx.departments);
    }
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const [res, ctx] = await Promise.all([listCompanyUsers(), getWorkspaceContext()]);
      if (!active) return;
      setUsers((res.users ?? []).map((u) => normalizeUserRow(u)));
      if (ctx.departments.length > 0) {
        setDepartments(ctx.departments);
      }
      setLoadingUsers(false);
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await createEmployee(formData);
    if (result?.error) {
      setError(result.error);
      showToast({ title: 'Could not create employee', description: result.error, tone: 'danger' });
    } else if (result?.success) {
      setSuccess(result.success);
      formRef.current?.reset();
      showToast({ title: result.success, tone: 'success' });
      await refreshUsers();
    }
    setLoading(false);
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const res = await deleteCompanyUser(deletingUser.id);
    if (res?.error) {
      showToast({ title: 'Could not remove user', description: res.error, tone: 'danger' });
      return;
    }
    showToast({ title: res?.success ?? 'User removed', tone: 'info' });
    setDeletingUser(null);
    await refreshUsers();
  };

  const columns: TableColumn<CompanyUserRow>[] = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      isRowHeader: true,
      getSortValue: (r) => r.name,
      renderCell: (u) => (
        <div>
          <div className="employee-name">{u.name}</div>
          <div className="employee-role">{u.email || 'No email'}</div>
        </div>
      ),
    },
    {
      key: 'emp_id',
      label: 'Emp ID',
      sortable: true,
      getSortValue: (r) => r.emp_id || '',
      renderCell: (u) => <span className="font-mono text-secondary">{u.emp_id || '—'}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      getSortValue: (r) => r.department || '',
      renderCell: (u) => (
        <div>
          <span className="badge badge--neutral">{u.department || 'Unassigned'}</span>
          {u.position && (
            <div className="card-subtitle" style={{ marginBlockStart: '0.2rem' }}>
              {u.position}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      getSortValue: (r) => r.role,
      renderCell: (u) => (
        <span
          className={`badge ${
            u.role === 'superadmin'
              ? 'badge--accent'
              : u.role === 'admin'
              ? 'badge--info'
              : 'badge--neutral'
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (r) => r.employee_status || 'Active',
      renderCell: (u) => (
        <span
          className={`badge ${
            u.employee_status === 'Inactive' ? 'badge--danger' : 'badge--success'
          }`}
        >
          {u.employee_status || 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      renderCell: (u) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setEditingUser(u)}
            aria-label={`Edit ${u.name}`}
            title="Edit user"
          >
            <Edit3 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setResetUser(u)}
            aria-label={`Reset password for ${u.name}`}
            title="Reset password"
          >
            <KeyRound size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setDeletingUser(u)}
            aria-label={`Delete ${u.name}`}
            title="Remove user"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-stack">
      <div className="section-header">
        <div>
          <h2 className="section-title">Employee Provisioning & Directory</h2>
          <p className="section-subtitle">
            Invite employees, manage company user profiles, and reset credentials.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <section className="surface-card" aria-labelledby="create-employee-heading">
          <div className="card-header">
            <div>
              <h3 id="create-employee-heading" className="card-title">
                Create New Employee
              </h3>
              <p className="card-subtitle">
                New accounts are automatically assigned the employee role for your company.
              </p>
            </div>
          </div>

          <form ref={formRef} action={handleSubmit} className="form-stack">
            <p className="form-hint">Fields marked * are required.</p>

            {error && (
              <div className="form-alert form-alert--error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="form-alert form-alert--success" role="status">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <div className="form-grid--2">
              <div className="field">
                <label htmlFor="name" className="field-label">
                  Full Name<span className="field-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  data-error="admin-name-error"
                  className="field-input"
                  placeholder="John Doe"
                />
                <div id="admin-name-error" className="error-msg">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>Full name is required.</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="emp_id" className="field-label">
                  Employee ID (Optional)
                </label>
                <input
                  id="emp_id"
                  name="emp_id"
                  type="text"
                  className="field-input"
                  placeholder="EMP-001"
                />
              </div>

              <div className="field">
                <label htmlFor="email" className="field-label">
                  Work Email<span className="field-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  data-error="admin-email-error"
                  className="field-input"
                  placeholder="john@company.com"
                />
                <div id="admin-email-error" className="error-msg">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>Enter a valid email address.</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="password" className="field-label">
                  Initial Password<span className="field-required" aria-hidden="true">*</span>
                </label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    data-error="admin-password-error"
                    className="field-input"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide initial password' : 'Show initial password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div id="admin-password-error" className="error-msg">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>Enter an initial password (minimum 6 characters).</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="department" className="field-label">
                  Department (Optional)
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  list="admin-dept-options"
                  className="field-input"
                  placeholder="e.g. Operations"
                />
                <datalist id="admin-dept-options">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="field">
                <label htmlFor="position" className="field-label">
                  Position (Optional)
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  autoComplete="organization-title"
                  className="field-input"
                  placeholder="e.g. Developer"
                />
              </div>
            </div>

            <div className="form-actions-end">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Employee Account'}
              </button>
            </div>
          </form>
        </section>

        <aside className="surface-card">
          <div className="section-head-row">
            <ShieldCheck size={18} className="section-head-icon" aria-hidden="true" />
            <h3 className="card-title">Security Policy</h3>
          </div>
          <p className="card-subtitle">
            Accounts created here are scoped to your company tenant. Password resets and removals
            enforce strict tenant isolation.
          </p>
          <p className="card-subtitle" style={{ marginBlockStart: '0.75rem' }}>
            Elevating an account to <strong>admin</strong> or <strong>superadmin</strong> requires
            Superadmin privileges.
          </p>
        </aside>
      </div>

      {/* Company Users Directory */}
      <section className="surface-card surface-card--flush" aria-labelledby="users-directory-heading">
        <div className="card-header" style={{ padding: '1rem 1.25rem 0.25rem' }}>
          <div>
            <h3 id="users-directory-heading" className="card-title">
              Company Users ({users.length})
            </h3>
            <p className="card-subtitle">Edit employee records, reset passwords, or remove access.</p>
          </div>
        </div>
        <SortableTable
          caption="Provisioned company users"
          columns={columns}
          rows={users}
          getRowKey={(u) => u.id}
          responsiveStack
          emptyMessage={loadingUsers ? 'Loading company users...' : 'No company users found.'}
        />
      </section>

      <ModalDialog
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Edit ${editingUser.name}` : 'Edit User'}
        subtitle="Update department, position, and active status"
        size="md"
      >
        {editingUser ? (
          <EditUserForm
            key={editingUser.id}
            user={editingUser}
            departments={departments}
            onClose={() => setEditingUser(null)}
            onSaved={refreshUsers}
          />
        ) : (
          <div />
        )}
      </ModalDialog>

      <ModalDialog
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        title={resetUser ? `Reset Password — ${resetUser.name}` : 'Reset Password'}
        subtitle="Assign a new sign-in password for this employee"
        size="sm"
      >
        {resetUser ? (
          <ResetPasswordForm key={resetUser.id} user={resetUser} onClose={() => setResetUser(null)} />
        ) : (
          <div />
        )}
      </ModalDialog>

      <DeleteConfirmModal
        open={Boolean(deletingUser)}
        title="Remove User Account"
        description={
          deletingUser
            ? `Permanently delete ${deletingUser.name}'s authentication and employee profile?`
            : ''
        }
        confirmLabel="Remove User"
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
