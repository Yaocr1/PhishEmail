import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'USER';
export type DashboardRole = 'Admin' | 'Security Analyst';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  dashboardRole: DashboardRole;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'phishbert_auth_user';

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email || (parsed.role !== 'ADMIN' && parsed.role !== 'USER')) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = (nextUser: AuthUser) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const dashboardRole: DashboardRole = user?.role === 'ADMIN' ? 'Admin' : 'Security Analyst';

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      dashboardRole,
      login,
      logout,
    }),
    [dashboardRole, user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
