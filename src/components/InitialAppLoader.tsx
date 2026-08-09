'use client';

import React, { useState, useEffect } from 'react';
import FullScreenLoader from './FullScreenLoader';

export default function InitialAppLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide the loader after hydration and a small delay for a smooth "app mount" feel
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return <FullScreenLoader message="Welcome" />;
}
