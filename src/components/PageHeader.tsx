'use client';

import { usePathname } from 'next/navigation';

export default function PageHeader() {
  const pathname = usePathname();
  
  let title = 'TEAM TASK MANAGEMENT SYSTEM';
  
  if (pathname === '/') {
    title = 'DASHBOARD';
  } else if (pathname === '/tasks') {
    title = 'TASKBOARD';
  } else if (pathname === '/gantt') {
    title = 'GANTT CHART';
  } else if (pathname === '/team') {
    title = 'TEAM WORKLOAD';
  }

  return <h1>{title}</h1>;
}
