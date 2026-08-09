'use client';

import React from 'react';

export default function FullScreenLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fullscreen-loader-bg" style={{
      position: 'fixed',
      inset: 0,
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        .loader-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid var(--dark);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          box-shadow: var(--shadow-extrude);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fullscreen-loader-bg {
          background-color: rgba(224, 229, 236, 0.8);
        }
        @media (prefers-color-scheme: dark) {
          .fullscreen-loader-bg {
            background-color: rgba(42, 45, 50, 0.8);
          }
        }
      `}</style>
      
      <div className="loader-spinner" />
      <div style={{
        marginTop: '24px',
        fontWeight: 600,
        color: 'var(--accent)',
        fontSize: '16px',
        letterSpacing: '0.5px'
      }}>
        {message}
      </div>
    </div>
  );
}
