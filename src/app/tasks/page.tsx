import { Plus, MoreHorizontal } from 'lucide-react';

export default function TasksPage() {
  const columns = [
    {
      title: 'Not Started',
      count: 3,
      tasks: [
        { id: 1, title: 'Client Onboarding Deck', category: 'Client Work', priority: 'Critical' },
        { id: 2, title: 'Q3 Financial Review', category: 'Finance', priority: 'High' },
        { id: 3, title: 'Team Outing Venue Search', category: 'Operations', priority: 'Low' },
      ],
    },
    {
      title: 'In Progress',
      count: 2,
      tasks: [
        { id: 4, title: 'Update Marketing Assets', category: 'Marketing', priority: 'High' },
        { id: 5, title: 'Database Migration Phase 1', category: 'Development', priority: 'Very High' },
      ],
    },
    {
      title: 'In Review',
      count: 1,
      tasks: [
        { id: 6, title: 'New Homepage Design', category: 'Design', priority: 'Medium' },
      ],
    },
    {
      title: 'Completed',
      count: 5,
      tasks: [
        { id: 7, title: 'Weekly Sync', category: 'Meeting', priority: 'Medium' },
        { id: 8, title: 'Server Maintenance', category: 'Operations', priority: 'High' },
      ],
    },
  ];

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>Tasks Board</h2>
          <p className="text-secondary">Manage and track your team's tasks across all stages.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <input type="text" className="neu-input" placeholder="Search tasks..." style={{ width: '250px' }} />
          <button className="neu-button primary">
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', overflowX: 'auto', paddingBottom: '32px' }}>
        {columns.map((column, idx) => (
          <div key={idx} style={{ minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-between" style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px' }}>{column.title}</h3>
                <span style={{ 
                  backgroundColor: 'var(--bg-dark)', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  boxShadow: 'var(--shadow-inset)'
                }}>
                  {column.count}
                </span>
              </div>
              <MoreHorizontal size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {column.tasks.map((task) => (
                <div key={task.id} className="neu-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex-between">
                    <span className="caption" style={{ color: 'var(--text-secondary)' }}>{task.category}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--accent)', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: 'var(--accent)' 
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{task.title}</h4>
                  
                  <div className="flex-between" style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex' }}>
                      {/* Mock Avatars */}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-extrude)', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', marginLeft: '-8px', position: 'relative', zIndex: 3 }}>JD</div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-extrude)', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', marginLeft: '-8px', position: 'relative', zIndex: 2 }}>AM</div>
                    </div>
                    <span className="caption" style={{ color: 'var(--text-secondary)' }}>2 days left</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="neu-button" style={{ borderStyle: 'dashed', padding: '12px', color: 'var(--text-secondary)' }}>
              <Plus size={16} /> Add Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
