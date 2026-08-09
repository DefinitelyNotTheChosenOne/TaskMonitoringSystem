'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, MoreVertical } from 'lucide-react';
import { getTeamMembers } from '@/lib/api/team';

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      const data = await getTeamMembers();
      setTeam(data);
      setLoading(false);
    }
    loadTeam();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>Team Data Sheet</h2>
          <p className="text-secondary">Directory of all employees and their roles.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="neu-button primary">Add Employee</button>
        </div>
      </div>

      <div className="neu-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--dark)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '24px', fontWeight: 600 }}>Employee</th>
              <th style={{ padding: '24px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '24px', fontWeight: 600 }}>Department</th>
              <th style={{ padding: '24px', fontWeight: 600 }}>Contact</th>
              <th style={{ padding: '24px', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading team data...
                </td>
              </tr>
            ) : team.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No team members found.
                </td>
              </tr>
            ) : team.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--shadow-inset)' }}>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--bg)',
                      boxShadow: 'var(--shadow-extrude)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: 'var(--accent)'
                    }}>
                      {emp.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{emp.name}</div>
                      <div className="caption" style={{ color: 'var(--text-secondary)' }}>{emp.position}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>{emp.emp_id}</td>
                <td style={{ padding: '24px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--text-secondary)', 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    color: 'var(--text-secondary)' 
                  }}>
                    {emp.department}
                  </span>
                </td>
                <td style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a href={`mailto:${emp.email}`} className="neu-button" style={{ padding: '8px', borderRadius: '50%' }}>
                      <Mail size={16} />
                    </a>
                    <button className="neu-button" style={{ padding: '8px', borderRadius: '50%' }}>
                      <Phone size={16} />
                    </button>
                  </div>
                </td>
                <td style={{ padding: '24px', textAlign: 'right' }}>
                  <button className="neu-button" style={{ padding: '8px', border: 'none', boxShadow: 'none' }}>
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
