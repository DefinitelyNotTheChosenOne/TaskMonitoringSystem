'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart, 
  KanbanSquare, 
  Video, 
  Users, 
  Settings,
  LogOut
} from 'lucide-react';
import FullScreenLoader from '@/components/FullScreenLoader';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on route change (mobile navigation)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {isLoggingOut && <FullScreenLoader message="Signing out..." />}
      {/* Backdrop overlay — only rendered on mobile when sidebar is open */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
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

        {(userRole === 'admin' || userRole === 'superadmin') && (
          <>
            <div className="sidebar-section-title">Admin</div>
            <nav className="sidebar-nav">
              <Link href="/admin/users" className={`nav-link ${pathname === '/admin/users' ? 'active' : ''}`}>
                <Users size={18} /> Manage Users
              </Link>
            </nav>
          </>
        )}

        {userRole === 'superadmin' && (
          <>
            <div className="sidebar-section-title">Superadmin</div>
            <nav className="sidebar-nav">
              <Link href="/superadmin/companies" className={`nav-link ${pathname === '/superadmin/companies' ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Manage Companies
              </Link>
            </nav>
          </>
        )}

        <div className="sidebar-section-title">Help</div>
        <nav className="sidebar-nav">
          <Link href="/settings" className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={18} /> Settings
          </Link>
          <button 
            onClick={async () => {
              setIsLoggingOut(true);
              const { logout } = await import('@/app/login/actions');
              await logout();
            }}
            className="nav-link" 
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <LogOut size={18} /> Log Out
          </button>
        </nav>
      </aside>
    </>
  );
}
