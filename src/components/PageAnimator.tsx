'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PageAnimator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-animate-shell page-animate-enter">
      {children}
    </div>
  );
}
