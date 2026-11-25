import React from 'react';
import { getServerDashboardData } from '@/lib/api/dashboardServer';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getPeriodForDate } from '@/lib/period';

export default async function HomePage() {
  const { month, year } = getPeriodForDate();
  const initialData = await getServerDashboardData(month, year);

  return <DashboardClient initialData={initialData} />;
}
