'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function MobileDrawer({
  id,
  open,
  onClose,
  title = 'Navigation drawer',
  children,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const openingRef = useRef(false);
  const hasEnteredRef = useRef(false);

  const openDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !scroller || drawer.open) return;

    openingRef.current = true;
    hasEnteredRef.current = false;
    drawer.showModal();

    if (!window.CSS?.supports?.('scroll-initial-target', 'nearest')) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'instant' as ScrollBehavior });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }

    if (drawer.open) {
      scroller.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, []);

  const closeDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !drawer.open || !scroller) return;

    openingRef.current = false;
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    if (open && !drawer.open) {
      void openDrawer();
    } else if (!open && drawer.open) {
      closeDrawer();
    }
  }, [open, openDrawer, closeDrawer]);

  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;

        if (entry.intersectionRatio >= visibleThreshold) {
          hasEnteredRef.current = true;
          if (entry.intersectionRatio === 1) {
            openingRef.current = false;
          }
        }

        if (
          entry.intersectionRatio < visibleThreshold &&
          drawer.open &&
          !openingRef.current &&
          hasEnteredRef.current
        ) {
          drawer.close();
          onClose();
        }
      },
      { root: drawer, threshold: [visibleThreshold, 1] }
    );

    observer.observe(sheet);

    let removeScrollListener: (() => void) | undefined;
    if (!window.CSS?.supports?.('animation-timeline: scroll()')) {
      const handleScroll = () => {
        const width = sheet.offsetWidth || 1;
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / width));
        drawer.style.setProperty('--drawer-backdrop', String(ratio));
      };
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      removeScrollListener = () => scroller.removeEventListener('scroll', handleScroll);
    }

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeDrawer();
      }
    };

    const handleDialogClick = (event: MouseEvent) => {
      if (!sheet.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    const handleNativeClose = () => {
      openingRef.current = false;
      hasEnteredRef.current = false;
      onClose();
    };

    drawer.addEventListener('cancel', handleCancel);
    drawer.addEventListener('click', handleDialogClick);
    drawer.addEventListener('close', handleNativeClose);

    return () => {
      observer.disconnect();
      removeScrollListener?.();
      drawer.removeEventListener('cancel', handleCancel);
      drawer.removeEventListener('click', handleDialogClick);
      drawer.removeEventListener('close', handleNativeClose);
    };
  }, [onClose, closeDrawer]);

  return (
    <dialog ref={drawerRef} id={id} className="mobile-drawer" aria-label={title}>
      <div ref={scrollerRef} className="mobile-drawer-scroller">
        <nav ref={sheetRef} className="mobile-drawer-sheet" aria-label="Primary navigation">
          <div className="mobile-drawer-top">
            <span className="mobile-drawer-title">Menu</span>
            <button
              type="button"
              className="btn-icon"
              onClick={closeDrawer}
              aria-label="Close navigation menu"
              autoFocus
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="mobile-drawer-body">{children}</div>
        </nav>
      </div>
    </dialog>
  );
}
