'use client';

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

let cachedCanTransitionDisplay: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedCanTransitionDisplay !== undefined) return cachedCanTransitionDisplay;
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }

  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = 'none';
  cachedCanTransitionDisplay = getComputedStyle(probe).display === 'block';
  probe.remove();
  return cachedCanTransitionDisplay;
}

function supportsTopLayerExit(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      window.CSS?.supports?.('overlay', 'auto') &&
      canTransitionDisplay()
  );
}

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  autoFocusClose?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  autoFocusClose = true,
  children,
  footer,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingRef = useRef(false);
  const titleId = useId();
  const subtitleId = useId();

  const closeTopLayer = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || closingRef.current) return;
    closingRef.current = true;

    try {
      if (!supportsTopLayerExit()) {
        dialog.setAttribute('data-closing', '');
        const animations = dialog.getAnimations({ subtree: true });
        if (animations.length > 0) {
          await Promise.race([
            Promise.allSettled(animations.map((a) => a.finished)),
            new Promise((resolve) => setTimeout(resolve, 400)),
          ]);
        }
        if (!dialog.hasAttribute('data-closing')) return;
        dialog.removeAttribute('data-closing');
      }

      if (dialog.open) {
        dialog.close();
      }
    } finally {
      closingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.removeAttribute('data-closing');
      dialog.showModal();
    } else if (!open && dialog.open) {
      void closeTopLayer();
    }
  }, [open, closeTopLayer]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.removeAttribute('data-closing');
      dialog.returnValue = '';
      onClose();
    };

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        void closeTopLayer();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);

    let cleanupPointerFallback: (() => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) {
          void closeTopLayer();
        }
        pressedOutside = false;
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupPointerFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      cleanupPointerFallback?.();
    };
  }, [onClose, closeTopLayer]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal-dialog modal-dialog--${size}`}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="modal-dialog-surface">
        <header className="modal-dialog-header">
          <div className="modal-dialog-titles">
            <h2 id={titleId} className="modal-dialog-title">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="modal-dialog-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-icon modal-close-btn"
            onClick={() => void closeTopLayer()}
            aria-label="Close dialog"
            autoFocus={autoFocusClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="modal-dialog-body">{children}</div>

        {footer && <footer className="modal-dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
