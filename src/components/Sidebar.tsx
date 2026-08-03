'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart, 
  KanbanSquare, 
  Video, 
  Users, 
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
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
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link href="/tasks" className={`nav-link ${pathname === '/tasks' ? 'active' : ''}`}>
          <ListTodo size={18} /> Tasks Board
        </Link>
        <Link href="/gantt" className={`nav-link ${pathname === '/gantt' ? 'active' : ''}`}>
          <BarChart size={18} /> Gantt Chart
        </Link>
        <Link href="/kanban" className={`nav-link ${pathname === '/kanban' ? 'active' : ''}`}>
          <KanbanSquare size={18} /> Kanban Board
        </Link>
        <Link href="/meetings" className={`nav-link ${pathname === '/meetings' ? 'active' : ''}`}>
          <Video size={18} /> Meetings
        </Link>
        <Link href="/team" className={`nav-link ${pathname === '/team' ? 'active' : ''}`}>
          <Users size={18} /> Team Data
        </Link>
      </nav>

      <div className="sidebar-section-title">Help</div>
      <nav className="sidebar-nav">
        <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}>
          <Settings size={18} /> Settings
        </Link>
      </nav>
    </aside>
  );
}
