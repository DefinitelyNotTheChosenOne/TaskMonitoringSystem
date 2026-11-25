'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Users,
  ClipboardList,
} from 'lucide-react';
import {
  type CompanyWithStats,
  createCompanyWithOptionalAdmin,
  deleteCompanyAction,
  listCompaniesWithStats,
  updateCompanyAction,
} from './actions';
import ModalDialog from '@/components/ui/ModalDialog';
import SortableTable, { TableColumn } from '@/components/ui/SortableTable';
import DeleteConfirmModal from '@/components/tasks/DeleteConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';

function CreateCompanyForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const res = await createCompanyWithOptionalAdmin(formData);
    setSaving(false);

    if (res?.error) {
      setError(res.error);
      showToast({ title: 'Could not onboard company', description: res.error, tone: 'danger' });
      return;
    }

    showToast({ title: res?.success ?? 'Company created', tone: 'success' });
    await onSaved();
    onClose();
  };

  return (
    <form action={handleSubmit} className="form-stack">
      <p className="form-hint">Fields marked * are required. Initial Admin fields are optional.</p>
      {error && (
        <div className="form-alert form-alert--error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="comp-name" className="field-label">
          Company Name<span className="field-required" aria-hidden="true">*</span>
        </label>
        <input
          id="comp-name"
          name="name"
          type="text"
          required
          className="field-input"
          placeholder="Acme Solutions Inc."
        />
      </div>

      <div className="field">
        <label htmlFor="comp-tagline" className="field-label">
          Tagline
        </label>
        <input
          id="comp-tagline"
          name="tagline"
          type="text"
          className="field-input"
          placeholder="Team Task Management Workspace"
        />
      </div>

      <div className="field">
        <label htmlFor="comp-mission" className="field-label">
          Mission Statement
        </label>
        <textarea
          id="comp-mission"
          name="mission"
          className="field-textarea"
          placeholder="Empower teams to execute projects with clarity and speed."
        />
      </div>

      <fieldset
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.875rem',
        }}
      >
        <legend className="field-label" style={{ paddingInline: '0.375rem' }}>
          Optional Initial Company Admin
        </legend>

        <div className="form-grid--2">
          <div className="field">
            <label htmlFor="admin_name" className="field-label">
              Admin Name
            </label>
            <input
              id="admin_name"
              name="admin_name"
              type="text"
              className="field-input"
              placeholder="Jane Admin"
            />
          </div>

          <div className="field">
            <label htmlFor="admin_email" className="field-label">
              Admin Email
            </label>
            <input
              id="admin_email"
              name="admin_email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              className="field-input"
              placeholder="admin@company.com"
            />
          </div>
        </div>

        <div className="field" style={{ marginBlockStart: '0.75rem' }}>
          <label htmlFor="admin_password" className="field-label">
            Admin Initial Password
          </label>
          <div className="password-field">
            <input
              id="admin_password"
              name="admin_password"
              type={showAdminPw ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={6}
              className="field-input"
              placeholder="Minimum 6 characters if creating admin"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowAdminPw((prev) => !prev)}
              aria-label={showAdminPw ? 'Hide admin password' : 'Show admin password'}
              aria-pressed={showAdminPw}
            >
              {showAdminPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </fieldset>

      <div className="form-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Onboarding...' : 'Create Company'}
        </button>
      </div>
    </form>
  );
}

function EditCompanyForm({
  company,
  onClose,
  onSaved,
}: {
  company: CompanyWithStats;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(company.name);
  const [tagline, setTagline] = useState(company.tagline);
  const [mission, setMission] = useState(company.mission);
  const { showToast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    const res = await updateCompanyAction(formData);
    setSaving(false);

    if (res?.error) {
      showToast({ title: 'Could not update company', description: res.error, tone: 'danger' });
      return;
    }

    showToast({ title: res?.success ?? 'Company updated', tone: 'success' });
    await onSaved();
    onClose();
  };

  return (
    <form action={handleSubmit} className="form-stack">
      <input type="hidden" name="id" value={company.id} />

      <div className="field">
        <label htmlFor="edit-comp-name" className="field-label">
          Company Name<span className="field-required" aria-hidden="true">*</span>
        </label>
        <input
          id="edit-comp-name"
          name="name"
          type="text"
          required
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="edit-comp-tagline" className="field-label">
          Tagline
        </label>
        <input
          id="edit-comp-tagline"
          name="tagline"
          type="text"
          className="field-input"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="edit-comp-mission" className="field-label">
          Mission Statement
        </label>
        <textarea
          id="edit-comp-mission"
          name="mission"
          className="field-textarea"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
        />
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

export default function SuperadminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithStats | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<CompanyWithStats | null>(null);
  const { showToast } = useToast();

  const refreshCompanies = useCallback(async () => {
    const res = await listCompaniesWithStats();
    setCompanies(res.companies);
    setSchemaMissing(res.schemaMissing);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const res = await listCompaniesWithStats();
      if (!active) return;
      setCompanies(res.companies);
      setSchemaMissing(res.schemaMissing);
      setLoading(false);
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;
    const res = await deleteCompanyAction(deletingCompany.id);
    if (res?.error) {
      showToast({ title: 'Could not remove company', description: res.error, tone: 'danger' });
      return;
    }
    showToast({ title: res?.success ?? 'Company removed', tone: 'info' });
    setDeletingCompany(null);
    await refreshCompanies();
  };

  const totalUsers = companies.reduce((sum, c) => sum + c.userCount, 0);
  const totalTasks = companies.reduce((sum, c) => sum + c.taskCount, 0);

  const columns: TableColumn<CompanyWithStats>[] = [
    {
      key: 'name',
      label: 'Organization',
      sortable: true,
      isRowHeader: true,
      getSortValue: (c) => c.name,
      renderCell: (c) => (
        <div>
          <div className="employee-name">{c.name}</div>
          <div className="employee-role">{c.tagline || 'Workspace Tenant'}</div>
        </div>
      ),
    },
    {
      key: 'mission',
      label: 'Mission',
      renderCell: (c) => (
        <span className="card-subtitle" style={{ display: 'inline-block', maxInlineSize: '22rem' }}>
          {c.mission || '—'}
        </span>
      ),
    },
    {
      key: 'users',
      label: 'Users',
      sortable: true,
      getSortValue: (c) => c.userCount,
      renderCell: (c) => <span className="badge badge--info font-mono">{c.userCount}</span>,
    },
    {
      key: 'tasks',
      label: 'Tasks',
      sortable: true,
      getSortValue: (c) => c.taskCount,
      renderCell: (c) => <span className="badge badge--neutral font-mono">{c.taskCount}</span>,
    },
    {
      key: 'created_at',
      label: 'Onboarded',
      sortable: true,
      getSortValue: (c) => c.created_at,
      renderCell: (c) => (
        <span className="font-mono text-secondary">
          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      renderCell: (c) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setEditingCompany(c)}
            aria-label={`Edit ${c.name}`}
            title="Edit company"
          >
            <Edit3 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setDeletingCompany(c)}
            aria-label={`Delete ${c.name}`}
            title="Delete company"
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
          <h2 className="section-title">Company Tenants</h2>
          <p className="section-subtitle">
            Onboard client organizations, seed default taxonomy, and assign company administrators.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCreateOpen(true)}
          disabled={schemaMissing}
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Company</span>
        </button>
      </div>

      {schemaMissing && (
        <div className="info-banner">
          <span>
            Run <code>supabase_migration.sql</code> in Supabase SQL Editor to enable multi-tenant
            company provisioning.
          </span>
        </div>
      )}

      <div className="dashboard-kpi-grid">
        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Active Tenants</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <Building2 size={16} />
            </span>
          </div>
          <div className="kpi-value font-mono">{companies.length}</div>
          <div className="kpi-meta">Organizations provisioned</div>
        </article>

        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Total Users</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <Users size={16} />
            </span>
          </div>
          <div className="kpi-value font-mono">{totalUsers}</div>
          <div className="kpi-meta">Across all tenants</div>
        </article>

        <article className="surface-card kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-label">Total Tasks</span>
            <span className="kpi-icon-pill" aria-hidden="true">
              <ClipboardList size={16} />
            </span>
          </div>
          <div className="kpi-value font-mono">{totalTasks}</div>
          <div className="kpi-meta">Tracked workspace items</div>
        </article>
      </div>

      <article className="surface-card surface-card--flush">
        <SortableTable
          caption="Provisioned company tenants"
          columns={columns}
          rows={companies}
          getRowKey={(c) => c.id}
          responsiveStack
          emptyMessage={loading ? 'Loading tenant companies...' : 'No company tenants onboarded yet.'}
        />
      </article>

      <ModalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Onboard Company Tenant"
        subtitle="Creates organization record, seeds default options, and optionally provisions an Admin."
        size="md"
      >
        <CreateCompanyForm onClose={() => setCreateOpen(false)} onSaved={refreshCompanies} />
      </ModalDialog>

      <ModalDialog
        open={Boolean(editingCompany)}
        onClose={() => setEditingCompany(null)}
        title={editingCompany ? `Edit ${editingCompany.name}` : 'Edit Company'}
        size="md"
      >
        {editingCompany ? (
          <EditCompanyForm
            key={editingCompany.id}
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
            onSaved={refreshCompanies}
          />
        ) : (
          <div />
        )}
      </ModalDialog>

      <DeleteConfirmModal
        open={Boolean(deletingCompany)}
        title="Delete Company Tenant"
        description={
          deletingCompany
            ? `Delete "${deletingCompany.name}" and detach its tenant workspace? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Company"
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
