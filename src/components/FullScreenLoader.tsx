'use client';

import React from 'react';

export default function FullScreenLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fullscreen-loader" role="status" aria-live="polite">
      <div className="loader-spinner" aria-hidden="true" />
      <div className="loader-message">{message}</div>
    </div>
  );
}
