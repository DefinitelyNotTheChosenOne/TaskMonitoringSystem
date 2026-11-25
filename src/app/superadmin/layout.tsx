import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';

export default async function SuperadminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await getUserRole();

  if (role !== 'superadmin') {
    redirect('/');
  }

  return <>{children}</>;
}
