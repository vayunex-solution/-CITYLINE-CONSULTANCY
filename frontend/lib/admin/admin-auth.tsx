'use client';

/**
 * CITYLINE CONSULTANCY — Administrative Authentication Context & Provider
 * Manages admin session lifecycle via HttpOnly cookie credentials and /admin/auth/me.
 *
 * GOVERNANCE:
 * - ZERO storage of tokens in localStorage/sessionStorage.
 * - Relies on server-controlled HttpOnly cookie session.
 * - Handles 401 unauthenticated vs 403 unauthorized distinct states.
 * - Authoritative server-side identity verification via /admin/auth/me.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminUser, adminFetch } from './admin-api';

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (identity: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const isLoginPage = normalizedPath === '/admin/login' || pathname?.startsWith('/admin/login');

  const refreshProfile = useCallback(async () => {
    try {
      const res = await adminFetch<{ admin: AdminUser }>('/admin/auth/me');
      if (res.success && res.data?.admin) {
        setUser(res.data.admin);
      } else {
        setUser(null);
      }
    } catch {
      // 401 or network failure implies unauthenticated session
      setUser(null);
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
      if (!user && !isLoginPage && normalizedPath.startsWith('/admin')) {
        router.push('/admin/login/');
      } else if (user && isLoginPage) {
        router.push('/admin/');
      }
    }
  }, [user, loading, isLoginPage, normalizedPath, router]);

  const login = async (identity: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await adminFetch<{ admin: AdminUser }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identity, password }),
      });

      if (res.success && res.data?.admin) {
        setUser(res.data.admin);
        router.push('/admin');
      } else {
        throw new Error('Login failed: Invalid response payload.');
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
      router.push('/admin/login');
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
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
