'use client';

import React, { useState, useEffect } from 'react';
import { X, PieChart } from 'lucide-react';

const dummyTasks = Array(20).fill(null).map((_, i) => ({
  person: i % 2 === 0 ? 'John Doe' : 'Jane Smith',
  task: `Update UI ${i + 1}`,
  desc: 'Refactor main dashboard components',
  category: i % 3 === 0 ? 'Design' : 'Development',
  priority: i % 4 === 0 ? 'High' : 'Medium',
  department: 'Product',
  dueDate: '10/08/26',
  daysLeft: '7',
  assignedOn: '01/08/26',
  status: i % 5 === 0 ? 'Completed' : 'In Progress',
  remarks: 'Open',
  attachments: '2 files',
  notes: 'Needs review'
}));

export default function TasksBoard() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOverlayOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        
        {/* Header & Top Summary KPI Bar */}
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            
            <div className="neu-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>August 03, 2026 Monday</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>12 Tasks Due Today</div>
            </div>
            
            <div className="neu-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tasks Due Today by Priority</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Critical: 2</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>V. High: 1</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>High: 4</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Medium: 3</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Low: 2</span>
              </div>
            </div>
            
            <div className="neu-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tasks Due Today by Status</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>WIP: 5</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>Review: 4</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Done: 3</span>
              </div>
            </div>
            
            <div className="neu-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Distribution by Category</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(91, 124, 250, 0.1)', color: 'var(--accent)' }}>Design: 4</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(91, 124, 250, 0.1)', color: 'var(--accent)' }}>Dev: 6</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: 'rgba(91, 124, 250, 0.1)', color: 'var(--accent)' }}>QA: 2</span>
              </div>
            </div>
            
            <div className="neu-card" style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Selected Year</div>
                <select className="neu-select" defaultValue="2026" style={{ width: '100%', padding: '4px', fontSize: '12px' }}>
                  <option value="2026">2026</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Selected Month</div>
                <select className="neu-select" defaultValue="August" style={{ width: '100%', padding: '4px', fontSize: '12px' }}>
                  <option value="August">August</option>
                </select>
              </div>
            </div>

            {/* Status Drawer Button */}
            <button 
              className="neu-button" 
              style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 24px' }}
              onClick={() => setIsOverlayOpen(true)}
            >
              <PieChart size={24} />
              <span style={{ fontWeight: 600 }}>Status</span>
            </button>

          </div>
        </div>

        {/* Main Body (Full Width Interactive Task Table) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div className="neu-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div className="table-scroll-container" style={{ overflow: 'auto', flex: 1 }}>
              <table className="neu-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--accent)', color: '#FFFFFF', zIndex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <tr>
                    {['Person Assigned', 'Task', 'Task Description', 'Category', 'Priority', 'Department', 'Due Date', 'Days Left', 'Assigned On (dd/mm/yy)', 'Status', 'Remarks', 'Attachments', 'Notes'].map((th, i) => (
                      <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dummyTasks.map((t, i) => (
                    <tr key={i} className="neu-table-row">
                      <td style={{ padding: '8px 12px' }}>{t.person}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{t.task}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.desc}</td>
                      <td style={{ padding: '8px 12px' }}>{t.category}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '11px',
                          backgroundColor: t.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: t.priority === 'High' ? '#ef4444' : '#f59e0b'
                        }}>{t.priority}</span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>{t.department}</td>
                      <td style={{ padding: '8px 12px' }}>{t.dueDate}</td>
                      <td style={{ padding: '8px 12px' }}>{t.daysLeft}</td>
                      <td style={{ padding: '8px 12px' }}>{t.assignedOn}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '11px',
                          backgroundColor: t.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: t.status === 'Completed' ? '#10b981' : '#3b82f6'
                        }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>{t.remarks}</td>
                      <td style={{ padding: '8px 12px' }}>{t.attachments}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Page SaaS Status Overlay */}
      {isOverlayOpen && (
        <div className="saas-overlay-backdrop">
          <div className="saas-overlay-header">
            <h2 className="saas-overlay-title">Task Status & Distribution</h2>
            <button className="saas-overlay-close" onClick={() => setIsOverlayOpen(false)} aria-label="Close overlay">
              <X size={20} />
            </button>
          </div>
          <div className="saas-overlay-body">
            <div className="saas-overlay-grid">
              
              {/* Card 1: Status Meters */}
              <div className="saas-card">
                <h3 className="saas-card-title">Tasks Due Today by Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
                  {[
                    { label: 'In Progress', count: 5, color: '#3b82f6', percent: '40%' },
                    { label: 'In Review', count: 4, color: '#f59e0b', percent: '33%' },
                    { label: 'Completed', count: 3, color: '#10b981', percent: '25%' },
                    { label: 'Overdue', count: 0, color: '#ef4444', percent: '0%' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                        <span>{item.label}</span>
                        <span className="saas-pill" style={{ background: `${item.color}20`, color: item.color }}>{item.count}</span>
                      </div>
                      <div className="saas-meter-track"><div className="saas-meter-fill" style={{ width: item.percent, background: item.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Category Bars */}
              <div className="saas-card">
                <h3 className="saas-card-title">Distribution by Category</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
                  {[
                    { label: 'Design', count: 4, color: '#8b5cf6', percent: '30%' },
                    { label: 'Development', count: 6, color: '#ec4899', percent: '45%' },
                    { label: 'QA', count: 2, color: '#06b6d4', percent: '15%' },
                    { label: 'Support', count: 1, color: '#f97316', percent: '10%' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.count}</span>
                      </div>
                      <div className="saas-meter-track"><div className="saas-meter-fill" style={{ width: item.percent, background: item.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Priority Metrics */}
              <div className="saas-card">
                <h3 className="saas-card-title">Distribution by Priority</h3>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '8px' }}>
                  {[
                    { label: 'Critical', count: 2, color: '#ef4444' },
                    { label: 'High', count: 4, color: '#f97316' },
                    { label: 'Medium', count: 3, color: '#3b82f6' },
                    { label: 'Low', count: 2, color: '#10b981' }
                  ].map((item, i) => (
                    <div key={i} className="saas-stat-row" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Department Bars */}
              <div className="saas-card">
                <h3 className="saas-card-title">Distribution by Department</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                  {[
                    { label: 'Admin', count: 1, percent: '10%' },
                    { label: 'Production', count: 5, percent: '40%' },
                    { label: 'Marketing', count: 2, percent: '20%' },
                    { label: 'Operations', count: 1, percent: '10%' },
                    { label: 'Finance', count: 3, percent: '20%' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '80px', fontSize: '12px', color: '#94a3b8' }}>{item.label}</div>
                      <div className="saas-meter-track" style={{ flex: 1, marginTop: 0 }}><div className="saas-meter-fill" style={{ width: item.percent, background: '#6366f1' }} /></div>
                      <div style={{ width: '20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: General Status Distribution */}
              <div className="saas-card">
                <h3 className="saas-card-title">General Status Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                  {[
                    { label: 'Pending', count: 8, percent: '35%' },
                    { label: 'Active', count: 12, percent: '50%' },
                    { label: 'Blocked', count: 3, percent: '15%' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '80px', fontSize: '12px', color: '#94a3b8' }}>{item.label}</div>
                      <div className="saas-meter-track" style={{ flex: 1, marginTop: 0 }}><div className="saas-meter-fill" style={{ width: item.percent, background: '#14b8a6' }} /></div>
                      <div style={{ width: '20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 6: Remarks Split */}
              <div className="saas-card">
                <h3 className="saas-card-title">Distribution by Remarks</h3>
                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Open Tasks</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#ffffff' }}>18</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Closed Tasks</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#ffffff' }}>45</div>
                  </div>
                </div>
              </div>

              {/* Card 7: Monthly Performance */}
              <div className="saas-card">
                <h3 className="saas-card-title">Monthly Performance Breakdown</h3>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table className="saas-table">
                    <thead>
                      <tr><th>Date</th><th>Total Tasks</th><th>Completed</th><th>Rate %</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Aug 01</td><td>12</td><td>10</td><td>83%</td></tr>
                      <tr><td>Aug 02</td><td>15</td><td>15</td><td>100%</td></tr>
                      <tr><td>Aug 03</td><td>8</td><td>4</td><td>50%</td></tr>
                      <tr><td>Aug 04</td><td>10</td><td>9</td><td>90%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 8: Yearly Performance */}
              <div className="saas-card">
                <h3 className="saas-card-title">Yearly Performance Breakdown</h3>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                  <table className="saas-table">
                    <thead>
                      <tr><th>Month</th><th>Total Tasks</th><th>Completed</th><th>Rate %</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>January</td><td>120</td><td>110</td><td>91%</td></tr>
                      <tr><td>February</td><td>95</td><td>85</td><td>89%</td></tr>
                      <tr><td>March</td><td>140</td><td>135</td><td>96%</td></tr>
                      <tr><td>April</td><td>115</td><td>100</td><td>86%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
