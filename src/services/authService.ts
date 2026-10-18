import type { AdminProfile } from '../lib/types';
import { delay, readJSON, removeKey, writeJSON } from './storage';

/**
 * Auth contract. The mock below keeps everything in localStorage; a real implementation would
 * call the backend and keep only the session token client-side.
 */
export interface AuthService {
  login(email: string, password: string): Promise<AdminProfile>;
  logout(): Promise<void>;
  /** Synchronous so route guards can decide without a flash. */
  currentSession(): AdminProfile | null;
  changeEmail(currentPassword: string, newEmail: string): Promise<AdminProfile>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public field?: 'email' | 'password' | 'currentPassword',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface StoredAccount extends AdminProfile {
  passwordHash: string;
}

const ACCOUNT_KEY = 'admin-account';
const SESSION_KEY = 'admin-session';

/** Demo seed credentials, also documented in the README. */
export const DEMO_CREDENTIALS = { email: 'admin@freelan.lk', password: 'Admin@123' } as const;

async function hash(value: string): Promise<string> {
  // Mock-only obfuscation so the password isn't stored in plain text. Not a substitute for server-side auth.
  const salted = `freelan::${value}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < salted.length; i++) h = (h * 33) ^ salted.charCodeAt(i);
  return `djb2-${(h >>> 0).toString(16)}`;
}

async function getAccount(): Promise<StoredAccount> {
  const existing = readJSON<StoredAccount | null>(ACCOUNT_KEY, null);
  if (existing) return existing;
  const seeded: StoredAccount = {
    name: 'Freelan Admin',
    email: DEMO_CREDENTIALS.email,
    passwordHash: await hash(DEMO_CREDENTIALS.password),
  };
  writeJSON(ACCOUNT_KEY, seeded);
  return seeded;
}

const toProfile = ({ name, email }: StoredAccount): AdminProfile => ({ name, email });

async function verify(password: string): Promise<StoredAccount> {
  const account = await getAccount();
  if ((await hash(password)) !== account.passwordHash) throw new AuthError('Current password is incorrect', 'currentPassword');
  return account;
}

export const authService: AuthService = {
  async login(email, password) {
    await delay(450);
    const account = await getAccount();
    const ok = account.email.toLowerCase() === email.trim().toLowerCase() && (await hash(password)) === account.passwordHash;
    if (!ok) throw new AuthError('That email and password combination is not recognised.');
    const profile = toProfile(account);
    writeJSON(SESSION_KEY, profile);
    return profile;
  },

  async logout() {
    removeKey(SESSION_KEY);
  },

  currentSession() {
    return readJSON<AdminProfile | null>(SESSION_KEY, null);
  },

  async changeEmail(currentPassword, newEmail) {
    await delay();
    const account = await verify(currentPassword);
    const next: StoredAccount = { ...account, email: newEmail.trim().toLowerCase() };
    writeJSON(ACCOUNT_KEY, next);
    const profile = toProfile(next);
    writeJSON(SESSION_KEY, profile);
    return profile;
  },

  async changePassword(currentPassword, newPassword) {
    await delay();
    const account = await verify(currentPassword);
    writeJSON(ACCOUNT_KEY, { ...account, passwordHash: await hash(newPassword) });
  },
};
