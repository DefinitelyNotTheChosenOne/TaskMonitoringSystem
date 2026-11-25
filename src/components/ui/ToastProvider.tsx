'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  persistent?: boolean;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let popoverPolyfillRequested = false;

function hasOpenModalDialog(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.querySelector('dialog[open]'));
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string, restoreFocus: boolean) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoDismiss = useCallback(() => {
    if (toast.persistent) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        onDismiss(toast.id, false);
      }
    }, 5000);
  }, [toast.id, toast.persistent, onDismiss]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Use setAttribute rather than IDL .popover so the polyfill is never shadowed
    el.setAttribute('popover', 'manual');
    try {
      (el as HTMLElement & { showPopover?: () => void }).showPopover?.();
    } catch {
      // Ignore if polyfill is still initializing or unsupported
    }

    scheduleAutoDismiss();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        (el as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [scheduleAutoDismiss]);

  const Icon =
    toast.tone === 'success'
      ? CheckCircle2
      : toast.tone === 'warning'
        ? TriangleAlert
        : toast.tone === 'danger'
          ? AlertCircle
          : Info;

  return (
    <div
      ref={cardRef}
      data-toast-id={toast.id}
      className={`toast-card toast-card--${toast.tone ?? 'info'}`}
      onPointerEnter={() => {
        pausedRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
        scheduleAutoDismiss();
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          pausedRef.current = false;
          scheduleAutoDismiss();
        }
      }}
    >
      <div className="toast-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.description && <p className="toast-description">{toast.description}</p>}
      </div>
      <button
        type="button"
        className="toast-close"
        aria-label="Close notification"
        onClick={() => onDismiss(toast.id, true)}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const pendingQueueRef = useRef<ToastItem[]>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!popoverPolyfillRequested && !Object.hasOwn(HTMLElement.prototype, 'popover')) {
      popoverPolyfillRequested = true;
      void import('@oddbird/popover-polyfill');
    }
  }, []);

  const announce = useCallback((toast: ToastInput) => {
    const message = toast.description ? `${toast.title}. ${toast.description}` : toast.title;
    const doc = document as Document & { ariaNotify?: (msg: string) => void };
    if (typeof doc.ariaNotify === 'function') {
      doc.ariaNotify(message);
    } else {
      setAnnouncement('');
      requestAnimationFrame(() => setAnnouncement(message));
    }
  }, []);

  const flushPending = useCallback(() => {
    if (pendingQueueRef.current.length === 0 || hasOpenModalDialog()) return;
    const queued = [...pendingQueueRef.current];
    pendingQueueRef.current = [];
    setToasts((prev) => [...prev, ...queued].slice(-4));
    const last = queued.at(-1);
    if (last) announce(last);
  }, [announce]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!hasOpenModalDialog()) {
        flushPending();
      }
    });
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
    });
    return () => observer.disconnect();
  }, [flushPending]);

  const showToast = useCallback(
    (input: ToastInput) => {
      counterRef.current += 1;
      const item: ToastItem = {
        ...input,
        id: `toast-${counterRef.current}`,
      };

      if (hasOpenModalDialog()) {
        pendingQueueRef.current.push(item);
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        const inToastRegion = document.activeElement.closest('.toast-region');
        if (!inToastRegion) {
          returnFocusRef.current = document.activeElement;
        }
      }

      setToasts((prev) => [...prev, item].slice(-4));
      announce(item);
    },
    [announce]
  );

  const dismissToast = useCallback((id: string, restoreFocus: boolean) => {
    setToasts((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);

      if (restoreFocus) {
        requestAnimationFrame(() => {
          if (next.length > 0) {
            const target = next[Math.min(idx, next.length - 1)];
            const btn = document.querySelector<HTMLButtonElement>(
              `[data-toast-id="${target.id}"] .toast-close`
            );
            btn?.focus();
          } else if (returnFocusRef.current?.isConnected) {
            returnFocusRef.current.focus();
          }
        });
      }
      return next;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <p className="visually-hidden">Screen reader announcements</p>
      <div id="toast-live-announcer" aria-live="assertive" className="visually-hidden">
        {announcement}
      </div>
      <div role="region" aria-label="Notifications" className="toast-region">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="toast-slot"
            style={{ '--toast-index': index } as React.CSSProperties}
          >
            <ToastCard toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
