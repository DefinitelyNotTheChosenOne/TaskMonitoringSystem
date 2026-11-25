export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'color-scheme';
const THEME_EVENT = 'tms:theme-change';

export function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark') {
      return value;
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  return 'system';
}

export function getResolvedSystemScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const content = preference === 'system' ? 'light dark' : preference;
  if (meta) {
    meta.content = content;
  }

  try {
    if (preference === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Theme still applies to current session even if persistence is blocked
  }

  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: preference }));
}

export function toggleEffectiveTheme(): ThemePreference {
  const stored = getStoredTheme();
  const system = getResolvedSystemScheme();
  const rendered: 'light' | 'dark' = stored === 'system' ? system : stored;
  const target: 'light' | 'dark' = rendered === 'dark' ? 'light' : 'dark';
  const next: ThemePreference = target === system ? 'system' : target;
  applyTheme(next);
  return next;
}

export function subscribeToThemeChanges(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      const next = getStoredTheme();
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (meta) {
        meta.content = next === 'system' ? 'light dark' : next;
      }
      onChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_EVENT, onChange);
  mediaQuery.addEventListener('change', onChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_EVENT, onChange);
    mediaQuery.removeEventListener('change', onChange);
  };
}
