'use client'

import React, { useState } from 'react';
import { createEmployee } from './actions';

export default function AdminUsersPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await createEmployee(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
      // Reset form if we wanted to
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>Manage Users</h2>
          <p className="text-secondary">Invite and manage employees for your company.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="neu-card" style={{ flex: 1 }}>
          <h3 className="card-title">Create New Employee</h3>
          <p className="text-secondary" style={{ marginBottom: '24px', fontSize: '13px' }}>
            New accounts created here will automatically be assigned the 'employee' role and linked to your company.
          </p>

          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', border: '1px solid #ef4444' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '13px', border: '1px solid #10b981' }}>
                {success}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="name" style={{ fontSize: '13px', fontWeight: 600 }}>Full Name</label>
                <input id="name" name="name" type="text" required className="neu-input" placeholder="John Doe" />
              </div>
              
              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="emp_id" style={{ fontSize: '13px', fontWeight: 600 }}>Employee ID (Optional)</label>
                <input id="emp_id" name="emp_id" type="text" className="neu-input" placeholder="EMP-007" />
              </div>

              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 600 }}>Email Address</label>
                <input id="email" name="email" type="email" required className="neu-input" placeholder="john@company.com" />
              </div>

              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600 }}>Initial Password</label>
                <input id="password" name="password" type="text" required className="neu-input" placeholder="••••••••" minLength={6} />
              </div>

              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="department" style={{ fontSize: '13px', fontWeight: 600 }}>Department (Optional)</label>
                <input id="department" name="department" type="text" className="neu-input" placeholder="e.g. Operations" />
              </div>

              <div className="flex-column" style={{ gap: '8px' }}>
                <label htmlFor="position" style={{ fontSize: '13px', fontWeight: 600 }}>Position (Optional)</label>
                <input id="position" name="position" type="text" className="neu-input" placeholder="e.g. Developer" />
              </div>
            </div>

            <button 
              type="submit" 
              className="neu-button" 
              style={{ marginTop: '16px', padding: '12px', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Employee Account'}
            </button>
          </form>
        </div>

        <div className="neu-card">
          <h3 className="card-title">Security Note</h3>
          <p className="text-secondary" style={{ fontSize: '13px', lineHeight: 1.6 }}>
            For security reasons, this interface is restricted to creating <strong>employee</strong> accounts only.
            <br /><br />
            If you need to elevate a user to an <strong>admin</strong> or <strong>superadmin</strong>, you must contact a Superadmin to manually adjust the role in the database.
          </p>
        </div>
      </div>
    </div>
  );
}
