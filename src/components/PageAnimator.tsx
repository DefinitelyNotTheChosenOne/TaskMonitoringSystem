'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Global Set to track visited paths during the current session
const visitedPages = new Set<string>();

export default function PageAnimator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Store whether this specific path was visited *before* this render
  const wasVisitedRef = useRef(visitedPages.has(pathname));

  // Update the ref if the pathname changes (e.g., when the key prop makes it remount, 
  // or if we just want to be safe, though key={pathname} forces a new instance).
  useEffect(() => {
    visitedPages.add(pathname);
  }, [pathname]);

  return (
    <div key={pathname} className={!wasVisitedRef.current ? 'page-animate-enter' : ''} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children}
    </div>
  );
}
