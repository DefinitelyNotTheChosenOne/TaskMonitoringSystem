'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleEffectiveTheme } from '@/lib/theme';

export default function ThemeQuickToggle() {
  return (
    <button
      type="button"
      className="btn-icon theme-quick-toggle"
      onClick={() => toggleEffectiveTheme()}
      title="Toggle color scheme"
    >
      <span className="theme-toggle-opt theme-toggle-opt--dark">
        <Moon size={18} aria-hidden="true" />
        <span className="visually-hidden">Switch to dark theme</span>
      </span>
      <span className="theme-toggle-opt theme-toggle-opt--light">
        <Sun size={18} aria-hidden="true" />
        <span className="visually-hidden">Switch to light theme</span>
      </span>
    </button>
  );
}
