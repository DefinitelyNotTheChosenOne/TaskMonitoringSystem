import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart, 
  KanbanSquare, 
  Video, 
  Users, 
  Settings,
  ExternalLink,
  Search,
  Bell
} from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'JRPCo Prime - Team Task Management',
  description: 'Team Task Management System 2026',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          {/* Sidebar */}
          <aside className="sidebar neu-card">
            <div className="sidebar-header">
              <div className="logo-container">
                <div className="logo-icon">J</div>
                <h2>JRPCo Prime</h2>
              </div>
              <p className="caption text-secondary">Team Task Management System 2026</p>
              <p className="caption text-secondary" style={{ marginTop: '8px' }}>Simplifying teamwork, one task at a time.</p>
            </div>

            <nav className="sidebar-nav">
              <Link href="/" className="neu-button primary nav-link active">
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <Link href="/tasks" className="neu-button nav-link">
                <ListTodo size={20} /> Tasks Board
              </Link>
              <Link href="/gantt" className="neu-button nav-link">
                <BarChart size={20} /> Gantt Chart
              </Link>
              <Link href="/kanban" className="neu-button nav-link">
                <KanbanSquare size={20} /> Kanban Board
              </Link>
              <Link href="/meetings" className="neu-button nav-link">
                <Video size={20} /> Meetings
              </Link>
              <Link href="/team" className="neu-button nav-link">
                <Users size={20} /> Team Data
              </Link>
              <Link href="/settings" className="neu-button nav-link">
                <Settings size={20} /> Settings
              </Link>
            </nav>

            <div className="sidebar-footer">
              <Link href="#" className="neu-button nav-link" style={{ marginBottom: '16px' }}>
                <ExternalLink size={20} /> Visit Website
              </Link>
              <div className="neu-card" style={{ padding: '16px', textAlign: 'center' }}>
                <h4 style={{ marginBottom: '8px' }}>Advance Daily</h4>
                <p className="caption text-secondary" style={{ marginBottom: '16px' }}>Unlock more features</p>
                <button className="neu-button primary" style={{ width: '100%' }}>Upgrade</button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <header className="top-bar">
              <div>
                <h2 style={{ margin: 0 }}>Current Date: June 05, 2024</h2>
                <p className="text-secondary">Current Tasks: 32 Done</p>
              </div>
              <div className="top-bar-actions">
                <div className="search-bar">
                  <Search size={20} className="text-secondary" />
                  <input type="text" placeholder="Search..." style={{ border: 'none', background: 'transparent', width: '100%' }} />
                </div>
                <button className="neu-button icon-btn">
                  <Bell size={20} />
                </button>
                <div className="profile-pic">
                  <img src="https://i.pravatar.cc/150?img=68" alt="Profile" />
                </div>
              </div>
            </header>
            
            <div className="page-content">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
