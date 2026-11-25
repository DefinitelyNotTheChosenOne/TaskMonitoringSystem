'use client';

import { useEffect } from 'react';

export default function FormValidationSync() {
  useEffect(() => {
    const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
    const dirtyState = new WeakMap<
      Element,
      { hasInteracted: boolean; hasBlurred: boolean }
    >();
    const flagged = new WeakSet<Element>();
    const announced = new WeakSet<Element>();

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'visually-hidden';
    document.body.append(announcer);

    let announceTimer: ReturnType<typeof setTimeout> | undefined;
    let announcedField: Element | undefined;

    const spokenText = (node: HTMLElement): string => {
      const copy = node.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      copy
        .querySelectorAll('[role="img"][aria-label]')
        .forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
      return (copy.textContent || '').replace(/\s+/g, ' ').trim();
    };

    const linkError = (el: HTMLElement, shown: boolean) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    };

    const announceError = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const errorEl = document.getElementById(errorId);
      if (!errorEl) return;
      const labelEl = el.labels?.[0];
      const labelText = labelEl ? `${spokenText(labelEl)}: ` : '';
      if (announceTimer) clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = labelText + spokenText(errorEl);
      }, 500);
    };

    const syncNative = (target: EventTarget | null, announce = false) => {
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches('input, select, textarea')) return;
      const el = target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const invalid = el.matches(':user-invalid');

      if (invalid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute('aria-invalid', 'true');
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.setAttribute('aria-invalid', 'false');
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          if (announceTimer) clearTimeout(announceTimer);
          announcer.textContent = '';
        }
      }
    };

    const updateFallback = (
      el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
      announce: boolean
    ) => {
      const isValid = el.validity.valid;
      el.classList.toggle('user-invalid-fallback', !isValid);
      el.classList.toggle('user-valid-fallback', isValid);
      el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
      linkError(el, !isValid);
      if (!isValid && announce && !announced.has(el)) {
        announceError(el);
        announced.add(el);
      } else if (isValid) {
        announced.delete(el);
      }
    };

    const initFields = (root: ParentNode = document) => {
      root.querySelectorAll('input, select, textarea').forEach((el) => {
        if (supportsUserInvalid) {
          syncNative(el, false);
        } else if (!el.hasAttribute('aria-invalid')) {
          el.setAttribute('aria-invalid', 'false');
        }
      });
    };

    initFields();

    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.matches('input, select, textarea')) {
              if (supportsUserInvalid) syncNative(node, false);
              else node.setAttribute('aria-invalid', 'false');
            } else {
              initFields(node);
            }
          }
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const onBlur = (e: Event) => {
      if (supportsUserInvalid) {
        syncNative(e.target, true);
        return;
      }
      const el = e.target;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(el, state);
        if (state.hasInteracted) updateFallback(el, true);
      }
    };

    const onInput = (e: Event) => {
      const el = e.target;
      if (supportsUserInvalid) {
        if (el instanceof Element && el.hasAttribute('aria-invalid')) {
          syncNative(el, false);
        }
        return;
      }
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(el, state);
        if (state.hasBlurred) updateFallback(el, false);
      }
    };

    const onChange = (e: Event) => {
      if (supportsUserInvalid) {
        syncNative(e.target, true);
        return;
      }
      const el = e.target;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(el, state);
        if (state.hasBlurred) updateFallback(el, true);
      }
    };

    const onInvalid = (e: Event) => {
      const el = e.target;
      if (supportsUserInvalid) {
        if (el instanceof Element) announced.add(el);
        syncNative(el, false);
        return;
      }
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
        announced.add(el);
        updateFallback(el, false);
      }
    };

    const onReset = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      setTimeout(() => {
        for (const control of Array.from(form.elements)) {
          if (supportsUserInvalid) {
            syncNative(control, false);
          } else if (control instanceof HTMLElement) {
            dirtyState.delete(control);
            control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
            if (control.matches('input, select, textarea')) {
              control.setAttribute('aria-invalid', 'false');
            }
            linkError(control, false);
          }
        }
      });
    };

    document.addEventListener('blur', onBlur, true);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange, true);
    document.addEventListener('invalid', onInvalid, true);
    document.addEventListener('reset', onReset, true);

    return () => {
      mutationObserver.disconnect();
      if (announceTimer) clearTimeout(announceTimer);
      announcer.remove();
      document.removeEventListener('blur', onBlur, true);
      document.removeEventListener('input', onInput);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('invalid', onInvalid, true);
      document.removeEventListener('reset', onReset, true);
    };
  }, []);

  return null;
}
