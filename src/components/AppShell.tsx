'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import PageAnimator from '@/components/PageAnimator';
import PageHeader from '@/components/PageHeader';
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <PageHeader />
          </div>
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
          <PageAnimator>
            {children}
          </PageAnimator>
        </div>
      </main>
    </div>
  );
}
