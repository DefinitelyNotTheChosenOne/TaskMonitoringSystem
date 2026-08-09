'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { getDashboardStats } from '@/lib/api/tasks';

export default function Home() {
  const [activeChart, setActiveChart] = useState<'department' | 'category'>('department');
  
  const [priorityData, setPriorityData] = useState<any[]>([
    { name: 'Low', value: 20, color: '#10b981' }, 
    { name: 'Medium', value: 30, color: '#3b82f6' }, 
    { name: 'High', value: 35, color: '#f59e0b' }, 
    { name: 'Very High', value: 5, color: '#f97316' }, 
    { name: 'Critical', value: 10, color: '#ef4444' }
  ]);
  const [statusData, setStatusData] = useState<any[]>([
    { name: 'Not Started', tasks: 15 },
    { name: 'In Progress', tasks: 24 },
    { name: 'On Hold', tasks: 5 },
    { name: 'Active', tasks: 12 },
    { name: 'In Review', tasks: 8 },
    { name: 'Completed', tasks: 32 },
    { name: 'Overdue', tasks: 5 },
    { name: 'Cancelled', tasks: 2 },
  ]);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const stats = await getDashboardStats();
      if (stats) {
        if (stats.priorityData.length > 0) setPriorityData(stats.priorityData);
        if (stats.statusData.length > 0) setStatusData(stats.statusData);
        setTasksCount(stats.tasks ? stats.tasks.length : 0);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const currentPerformanceData = [
    { day: '28', tasks: 12 }, { day: '29', tasks: 19 },
    { day: '30', tasks: 15 }, { day: '31', tasks: 22 },
    { day: '01', tasks: 28 }, { day: '02', tasks: 10 },
    { day: '03', tasks: 14 },
  ];

  const departmentData = [
    { name: 'Admin', completed: 45, notCompleted: 10 },
    { name: 'Production', completed: 80, notCompleted: 20 },
    { name: 'Marketing', completed: 35, notCompleted: 15 },
    { name: 'Operations', completed: 20, notCompleted: 5 },
    { name: 'Finance', completed: 50, notCompleted: 10 },
  ];

  const categoryData = [
    { name: 'Project', completed: 60, notCompleted: 10 },
    { name: 'Design', completed: 85, notCompleted: 20 },
    { name: 'Meeting', completed: 40, notCompleted: 10 },
    { name: 'Development', completed: 25, notCompleted: 5 },
    { name: 'Client Work', completed: 55, notCompleted: 15 },
    { name: 'Support', completed: 30, notCompleted: 5 },
  ];

  const monthlyData = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    tasks: Math.floor(Math.random() * 20) + 5
  }));

  const yearlyData = [
    { month: 'January', tasks: 120 }, { month: 'February', tasks: 150 },
    { month: 'March', tasks: 180 }, { month: 'April', tasks: 140 },
    { month: 'May', tasks: 200 }, { month: 'June', tasks: 170 },
    { month: 'July', tasks: 220 }, { month: 'August', tasks: 210 },
    { month: 'September', tasks: 190 }, { month: 'October', tasks: 230 },
    { month: 'November', tasks: 250 }, { month: 'December', tasks: 280 },
  ];

  return (
    <div className="dashboard-grid">
      
      {/* Column 1 & 2 Combined */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div className="dashboard-inner-grid">
          {/* Company Information & Mission */}
          <div className="neu-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="card-title" style={{ width: '100%' }}>Company Information</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-extrude)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Company<br/>Logo</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Company Name</h2>
                <p className="text-secondary">Company Tagline</p>
              </div>
            </div>
            <div style={{ width: '100%', marginTop: '24px' }}>
              <h3 className="card-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Mission</h3>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg)', boxShadow: 'var(--shadow-inset)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                To deliver high-quality, innovative solutions that empower teams to collaborate efficiently and stay organized every single day.
              </div>
            </div>
          </div>

          {/* Tasks By Priority Level */}
          <div className="neu-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">Tasks By Priority Level</h3>
            <div style={{ flex: 1, position: 'relative', minHeight: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Legend iconType="square" layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{tasksCount > 0 ? '100%' : '0%'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks By Status (Now spanning full width) */}
        <div className="neu-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title">Tasks By Status</h3>
          <div style={{ flex: 1, minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={80} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Bar dataKey="tasks" fill="var(--chart-4)" barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Column 3 */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div className="neu-card" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title">Current Performance (Last 7 Days)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="tasks" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-kpi-row">
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Overdue</h3>
            <div className="kpi-sub-card">
              <div className="kpi-number">00</div>
              <div className="caption text-secondary" style={{ textAlign: 'center' }}>Last Week<br/>(Mon-Sun)</div>
            </div>
          </div>
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Ongoing</h3>
            <div className="kpi-sub-card">
              <div className="kpi-number">00</div>
              <div className="caption text-secondary" style={{ textAlign: 'center' }}>This Week<br/>(Mon-Sun)</div>
            </div>
          </div>
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Upcoming</h3>
            <div className="kpi-sub-card">
              <div className="kpi-number">00</div>
              <div className="caption text-secondary" style={{ textAlign: 'center' }}>Next Week<br/>(Mon-Sun)</div>
            </div>
          </div>
        </div>

        <div className="neu-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Tasks By {activeChart === 'department' ? 'Department' : 'Category'}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="neu-button" 
                style={{ padding: '4px 12px', fontSize: '12px', borderColor: activeChart === 'department' ? 'var(--accent)' : 'transparent', color: activeChart === 'department' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeChart === 'department' ? 'var(--shadow-inset)' : 'var(--shadow-extrude)' }}
                onClick={() => setActiveChart('department')}
              >
                Department
              </button>
              <button 
                className="neu-button" 
                style={{ padding: '4px 12px', fontSize: '12px', borderColor: activeChart === 'category' ? 'var(--accent)' : 'transparent', color: activeChart === 'category' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeChart === 'category' ? 'var(--shadow-inset)' : 'var(--shadow-extrude)' }}
                onClick={() => setActiveChart('category')}
              >
                Category
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'department' ? (
                <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={75} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Legend iconType="square" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey="completed" name="Completed" fill="var(--accent)" barSize={8} />
                  <Bar dataKey="notCompleted" name="Not Completed" fill="var(--chart-2)" barSize={8} />
                </BarChart>
              ) : (
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={75} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Legend iconType="square" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }} />
                  <Bar dataKey="completed" name="Completed" fill="var(--accent)" barSize={8} />
                  <Bar dataKey="notCompleted" name="Not Completed" fill="var(--chart-2)" barSize={8} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Column 4 */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div className="neu-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <h3 className="card-title" style={{ width: '100%', marginBottom: '16px' }}>Current Date</h3>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>03 Aug 2026</div>
            <div className="text-secondary" style={{ fontSize: '14px' }}>Monday</div>
          </div>
        </div>
        <div className="neu-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <h3 className="card-title" style={{ width: '100%', marginBottom: '16px' }}>Current Tasks</h3>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{tasksCount}</div>
            <div className="caption text-secondary">Total</div>
          </div>
        </div>

        <div className="neu-card" style={{ height: '240px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title">Monthly Performance (Task Completion)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="tasks" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--bg)', stroke: 'var(--accent)', r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title">Yearly Performance (Task Completion)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, angle: -45, textAnchor: 'end' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-extrude)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="tasks" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--bg)', stroke: 'var(--accent)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
