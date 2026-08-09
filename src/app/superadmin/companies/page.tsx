import React from 'react';

export default function SuperadminCompaniesPage() {
  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>Manage Companies (Tenants)</h2>
          <p className="text-secondary">Onboard new companies and assign initial administrators.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="neu-button primary">Add Company</button>
        </div>
      </div>

      <div className="neu-card">
        <p className="text-secondary" style={{ textAlign: 'center', padding: '48px 0' }}>
          Company management tools will go here. You can create new tenant accounts and assign Admins to them.
        </p>
      </div>
    </div>
  );
}
