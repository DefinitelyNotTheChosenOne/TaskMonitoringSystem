'use client';

import React, { useEffect } from 'react';

interface SwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

let switchPolyfillRequested = false;

export default function Switch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SwitchProps) {
  useEffect(() => {
    if (
      !switchPolyfillRequested &&
      typeof window !== 'undefined' &&
      !('switch' in HTMLInputElement.prototype)
    ) {
      switchPolyfillRequested = true;
      if (!document.querySelector('script[data-input-switch-polyfill="true"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = '/vendor/input-switch-polyfill/input-switch-polyfill.js';
        script.dataset.inputSwitchPolyfill = 'true';
        document.head.appendChild(script);
      }
    }
  }, []);

  return (
    <div className="switch-row">
      <div className="switch-copy">
        <label htmlFor={id} className="switch-label">
          {label}
        </label>
        {description && <p className="switch-description">{description}</p>}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="native-switch"
        {...({ switch: '' } as Record<string, string>)}
      />
    </div>
  );
}
