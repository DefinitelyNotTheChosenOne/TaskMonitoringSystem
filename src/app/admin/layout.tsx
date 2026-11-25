import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await getUserRole();

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/');
  }

  return <>{children}</>;
}
