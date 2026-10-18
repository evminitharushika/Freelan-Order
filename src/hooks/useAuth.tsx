import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { AdminProfile } from '../lib/types';

interface AuthContextValue {
  user: AdminProfile | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  changeEmail(currentPassword: string, newEmail: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(() => authService.currentSession());

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authService.login(email, password));
  }, []);
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);
  const changeEmail = useCallback(async (currentPassword: string, newEmail: string) => {
    setUser(await authService.changeEmail(currentPassword, newEmail));
  }, []);
  const changePassword = useCallback((currentPassword: string, newPassword: string) => authService.changePassword(currentPassword, newPassword), []);

  const value = useMemo(() => ({ user, login, logout, changeEmail, changePassword }), [user, login, logout, changeEmail, changePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
