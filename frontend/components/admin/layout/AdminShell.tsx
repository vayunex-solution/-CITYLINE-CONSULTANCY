'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin/admin-auth';
import styles from './AdminShell.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Visa Enquiries', href: '/admin/visa-enquiries', icon: '🛂' },
  { label: 'Job Vacancies', href: '/admin/jobs', icon: '💼' },
  { label: 'Job Applications', href: '/admin/applications', icon: '📋' },
  { label: 'Manpower Requisitions', href: '/admin/manpower', icon: '🏢' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: '⭐' },
  { label: 'Notification Queue', href: '/admin/notifications', icon: '📬' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: '📜' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // On login page, render child component directly without shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state while checking authentication
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying administrative session...</p>
      </div>
    );
  }

  // If not authenticated and not on login, the context will redirect, render fallback in interim
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.brandLogo} aria-hidden="true">🏛️</span>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Cityline Admin</span>
            <span className={styles.brandBadge}>Management Console</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.fullName || user?.username}</div>
              <div className={styles.userRole}>{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContainer}>
        <header className={styles.topBar}>
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
          >
            ☰
          </button>

          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Status: <strong style={{ color: 'var(--status-success)' }}>● Operational</strong>
          </div>

          <div className={styles.topBarRight}>
            <span className={styles.roleBadge}>
              {user?.role === 'super_admin' ? 'Super Admin' : 'Operator'}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {user?.email}
            </span>
            <button className={styles.logoutBtn} onClick={() => logout()}>
              Logout
            </button>
          </div>
        </header>

        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
