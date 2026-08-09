import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import './globals.css';

import { getUserRole } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'TEAM TASK MANAGEMENT SYSTEM',
  description: 'Team Task Management System',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRole = await getUserRole();

  return (
    <html lang="en">
      <body>
        <AppShell userRole={userRole}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
