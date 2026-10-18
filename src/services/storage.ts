/**
 * The only module that touches browser storage. Services build on this; components never do.
 * Swap the services for API-backed implementations and this file goes away.
 */
const PREFIX = 'freelan:';

function area(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: 'local' | 'session' = 'local'): T {
  try {
    const raw = area(kind)?.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: 'local' | 'session' = 'local'): void {
  try {
    area(kind)?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app keeps working in memory */
  }
}

export function removeKey(key: string, kind: 'local' | 'session' = 'local'): void {
  try {
    area(kind)?.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Simulates network latency so loading states are exercised like a real API. */
export const delay = (ms = 250): Promise<void> => new Promise((r) => setTimeout(r, ms));
