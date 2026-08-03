import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import PageAnimator from '@/components/PageAnimator';
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
          <Sidebar />

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
              <PageAnimator>
                {children}
              </PageAnimator>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
