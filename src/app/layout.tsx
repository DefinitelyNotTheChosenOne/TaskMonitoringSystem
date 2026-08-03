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
  Globe,
  Rocket
} from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'TEAM TASK MANAGEMENT SYSTEM',
  description: 'Team Task Management System',
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
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="logo-container">
                <div className="logo-icon">J</div>
                <div className="logo-text">
                  Team Task<br/>Management<br/>System
                </div>
              </div>
            </div>

            <div className="sidebar-section-title">Menu</div>
            <nav className="sidebar-nav">
              <Link href="/" className="nav-link active">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link href="/tasks" className="nav-link">
                <ListTodo size={18} /> Tasks Board
              </Link>
              <Link href="/gantt" className="nav-link">
                <BarChart size={18} /> Gantt Chart
              </Link>
              <Link href="/kanban" className="nav-link">
                <KanbanSquare size={18} /> Kanban Board
              </Link>
              <Link href="/meetings" className="nav-link">
                <Video size={18} /> Meetings
              </Link>
              <Link href="/team" className="nav-link">
                <Users size={18} /> Team Data
              </Link>
            </nav>

            <div className="sidebar-section-title">Help</div>
            <nav className="sidebar-nav">
              <Link href="/settings" className="nav-link">
                <Settings size={18} /> Settings
              </Link>
              <Link href="#" className="nav-link">
                <Globe size={18} /> Visit Website
              </Link>
              <Link href="#" className="nav-link">
                <Rocket size={18} /> Advance Daily
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <header className="top-bar">
              <h1>TEAM TASK MANAGEMENT SYSTEM</h1>
              <div className="top-bar-actions">
                <button className="neu-button" style={{ minWidth: '100px' }}>January</button>
                <select className="neu-select" defaultValue="2024" style={{ minWidth: '100px' }}>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
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
