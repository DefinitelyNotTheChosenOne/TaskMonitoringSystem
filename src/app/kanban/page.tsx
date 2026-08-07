"use client";

import React from "react";

// Consolidated to 4 core columns
const CORE_COLUMNS = [
  "Not Started",
  "In Progress",
  "In Review",
  "Completed"
];

// Helper to determine priority color
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical': return '#ef4444'; // Red
    case 'high': return '#f59e0b';     // Amber
    case 'medium': return '#3b82f6';   // Blue
    case 'low': return '#10b981';      // Green
    default: return 'var(--text-secondary)';
  }
};

// Updated mock tasks with metadata. "Active" tasks remapped to "In Progress". 
// Filtered out "On Hold", "Overdue", and "Cancelled".
const mockTasks = [
  { id: "TSK-001", title: "Initialize project structure", status: "Completed", priority: "High", assignee: "JS", dueDate: "2026-08-01" },
  { id: "TSK-002", title: "Design database schema", status: "In Progress", priority: "Critical", assignee: "AM", dueDate: "2026-08-10" },
  { id: "TSK-003", title: "Setup authentication API", status: "Not Started", priority: "High", assignee: "BK", dueDate: "2026-08-12" },
  { id: "TSK-004", title: "Review frontend mockups", status: "In Review", priority: "Medium", assignee: "JS", dueDate: "2026-08-08" },
  { id: "TSK-007", title: "Monitor production logs", status: "In Progress", priority: "Low", assignee: "TR", dueDate: "2026-08-15" }, 
  { id: "TSK-009", title: "Write unit tests for UI", status: "Not Started", priority: "Medium", assignee: "AM", dueDate: "2026-08-20" },
  { id: "TSK-010", title: "Fix mobile navigation bug", status: "In Progress", priority: "High", assignee: "BK", dueDate: "2026-08-09" },
  { id: "TSK-011", title: "Audit security vulnerabilities", status: "In Progress", priority: "Critical", assignee: "TR", dueDate: "2026-08-11" }, 
  { id: "TSK-012", title: "Prepare release notes", status: "In Review", priority: "Low", assignee: "JS", dueDate: "2026-08-14" }
];

export default function KanbanBoard() {
  return (
    <div style={{ padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>KANBAN BOARD</h1>
      </header>

      <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
        
        {CORE_COLUMNS.map((columnStatus) => {
          const columnTasks = mockTasks.filter((task) => task.status === columnStatus);

          return (
            <div key={columnStatus} style={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-lg)', minWidth: '320px', width: '320px', display: 'flex', flexDirection: 'column', padding: '16px', boxShadow: 'var(--shadow-inset)', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '2px solid var(--accent)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{columnStatus}</h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg)', padding: '4px 10px', borderRadius: '12px', boxShadow: 'var(--shadow-extrude)' }}>
                  {columnTasks.length}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '200px' }}>
                {columnTasks.map((task) => (
                  <div key={task.id} style={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-extrude)', cursor: 'grab', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                    
                    {/* Top Row: Task ID and Priority Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>{task.id}</span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px', color: '#fff', backgroundColor: getPriorityColor(task.priority), boxShadow: 'var(--shadow-extrude)' }}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Middle Row: Title */}
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{task.title}</h3>
                    
                    {/* Bottom Row: Due Date and Assignee Avatar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>📅</span> {task.dueDate}
                      </div>
                      
                      {/* Neumorphic Assignee Avatar */}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', boxShadow: 'var(--shadow-extrude)' }}>
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
      </div>
    </div>
  );
}
