'use client';

import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

const priorityData = [
  { name: 'High', value: 30, color: '#FF6B6B' },
  { name: 'Medium', value: 50, color: 'var(--accent)' },
  { name: 'Low', value: 20, color: '#4ECDC4' },
];

const currentPerformanceData = [
  { day: 'Mon', tasks: 12 },
  { day: 'Tue', tasks: 19 },
  { day: 'Wed', tasks: 15 },
  { day: 'Thu', tasks: 22 },
  { day: 'Fri', tasks: 28 },
  { day: 'Sat', tasks: 10 },
  { day: 'Sun', tasks: 14 },
];

const departmentData = [
  { name: 'Marketing', tasks: 45 },
  { name: 'Engineering', tasks: 80 },
  { name: 'Sales', tasks: 35 },
  { name: 'HR', tasks: 20 },
  { name: 'Design', tasks: 50 },
];

const categoryData = [
  { name: 'Bug Fixes', tasks: 60 },
  { name: 'Features', tasks: 85 },
  { name: 'Maintenance', tasks: 40 },
  { name: 'Meetings', tasks: 25 },
];

const monthlyData = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  tasks: Math.floor(Math.random() * 20) + 5
}));

const yearlyData = [
  { month: 'Jan', tasks: 120 }, { month: 'Feb', tasks: 150 },
  { month: 'Mar', tasks: 180 }, { month: 'Apr', tasks: 140 },
  { month: 'May', tasks: 200 }, { month: 'Jun', tasks: 170 },
  { month: 'Jul', tasks: 220 }, { month: 'Aug', tasks: 210 },
  { month: 'Sep', tasks: 190 }, { month: 'Oct', tasks: 230 },
  { month: 'Nov', tasks: 250 }, { month: 'Dec', tasks: 280 },
];

export default function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '24px' }}>
      
      {/* Column 1 */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div className="neu-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3>Tasks By Priority Level</h3>
            <MoreHorizontal className="text-secondary" size={20} />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg)', 
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    boxShadow: 'var(--shadow-extrude)'
                  }} 
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>100%</div>
              <div className="caption text-secondary">Total</div>
            </div>
          </div>
          <div className="flex-between" style={{ marginTop: '16px' }}>
            {priorityData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                <span className="caption text-secondary">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3>Tasks By Department</h3>
            <MoreHorizontal className="text-secondary" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-extrude)' }}
                />
                <Bar dataKey="tasks" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Column 2 */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div className="neu-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3>Current Performance (Last 7 Days)</h3>
            <MoreHorizontal className="text-secondary" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dark)" opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-extrude)' }}
                />
                <Line type="monotone" dataKey="tasks" stroke="var(--accent)" strokeWidth={3} dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3>Tasks By Category</h3>
            <MoreHorizontal className="text-secondary" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dark)" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-extrude)' }}
                />
                <Bar dataKey="tasks" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Column 3 */}
      <div className="flex-column" style={{ gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {/* Status Cards */}
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="caption text-secondary" style={{ marginBottom: '8px' }}>Overdue</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF6B6B' }}>5</div>
          </div>
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="caption text-secondary" style={{ marginBottom: '8px' }}>Ongoing</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>24</div>
          </div>
          <div className="neu-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="caption text-secondary" style={{ marginBottom: '8px' }}>Upcoming</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ECDC4' }}>12</div>
          </div>
        </div>

        <div className="neu-card flex-between" style={{ padding: '12px 24px', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600 }}>January, 2024</span>
          <ChevronDown size={20} className="text-secondary" />
        </div>

        <div className="neu-card" style={{ height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px' }}>Monthly Performance (Task Completion)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <Line type="monotone" dataKey="tasks" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-extrude)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-card" style={{ height: '260px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px' }}>Yearly Performance (Task Completion)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} dy={5} />
                <Line type="monotone" dataKey="tasks" stroke="#4ECDC4" strokeWidth={2} dot={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: 'none', boxShadow: 'var(--shadow-extrude)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
