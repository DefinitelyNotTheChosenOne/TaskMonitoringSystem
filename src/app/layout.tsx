import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import AppShell from '@/components/AppShell';
import { ToastProvider } from '@/components/ui/ToastProvider';
import FormValidationSync from '@/components/ui/FormValidationSync';
import { WorkspacePeriodProvider } from '@/components/WorkspacePeriodProvider';
import { getCurrentUserContext } from '@/lib/auth';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JRPCo Prime — Team Task Management System',
  description: 'Modern SaaS workspace for team task monitoring, Kanban, Gantt, and meetings',
};

const FOUC_THEME_SCRIPT =
  'try{var s=localStorage.getItem("color-scheme");if(s==="light"||s==="dark"){document.querySelector(\'meta[name="color-scheme"]\').content=s}var d=localStorage.getItem("tms-density");if(d==="compact"){document.documentElement.dataset.density="compact"}}catch(e){}';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userContext = await getCurrentUserContext();
  const userRole = userContext?.role ?? null;
  const userName = userContext?.name ?? userContext?.email?.split('@')[0] ?? null;
  const company = userContext?.company ?? null;

  const now = new Date();
  const serverDateStamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: FOUC_THEME_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>
          <WorkspacePeriodProvider initialDateStamp={serverDateStamp}>
            <FormValidationSync />
            <AppShell userRole={userRole} userName={userName} company={company}>
              {children}
            </AppShell>
          </WorkspacePeriodProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
