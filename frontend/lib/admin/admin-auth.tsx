'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AdminUser,
  getStoredAdminToken,
  setStoredAdminToken,
  adminFetch,
} from './admin-api';

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string;
  loading: boolean;
  login: (identity: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  const refreshProfile = useCallback(async () => {
    const currentToken = getStoredAdminToken();
    if (!currentToken) {
      setUser(null);
      setToken('');
      setLoading(false);
      return;
    }

    try {
      const res = await adminFetch<AdminUser>('/admin/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        setToken(currentToken);
      } else {
        setUser(null);
        setToken('');
        setStoredAdminToken('');
      }
    } catch {
      setUser(null);
      setToken('');
      setStoredAdminToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Route protection redirect
  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage && pathname.startsWith('/admin')) {
        router.push('/admin/login');
      } else if (user && isLoginPage) {
        router.push('/admin');
      }
    }
  }, [user, loading, isLoginPage, pathname, router]);

  const login = async (identity: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await adminFetch<{ admin: AdminUser }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identity, password }),
      });

      if (res.success && res.data?.admin) {
        setUser(res.data.admin);
        // If the server sets a cookie, or token is stored
        // Note: For Authorization Bearer fallback we store any token
        router.push('/admin');
      } else {
        throw new Error('Login failed: Invalid server response.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await adminFetch('/admin/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setUser(null);
      setToken('');
      setStoredAdminToken('');
      router.push('/admin/login');
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
