'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin/admin-auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './AdminShell.module.css';

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconAnalytics = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconVisa = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconJobs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconApplications = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);
const IconManpower = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconTestimonials = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="13" y2="14" />
  </svg>
);
const IconNotifications = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconAudit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconBrand = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconMaster = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', Icon: IconDashboard },
  { label: 'Analytics', href: '/admin/analytics', Icon: IconAnalytics },
  { label: 'Visa Enquiries', href: '/admin/visa-enquiries', Icon: IconVisa },
  { label: 'Job Vacancies', href: '/admin/jobs', Icon: IconJobs },
  { label: 'Job Applications', href: '/admin/applications', Icon: IconApplications },
  { label: 'Manpower Requisitions', href: '/admin/manpower', Icon: IconManpower },
  { label: 'Testimonials', href: '/admin/testimonials', Icon: IconTestimonials },
  { label: 'Master Tables', href: '/admin/master', Icon: IconMaster },
  { label: 'Notification Queue', href: '/admin/notifications', Icon: IconNotifications },
  { label: 'Audit Logs', href: '/admin/audit-logs', Icon: IconAudit },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAuthenticated } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  if (normalizedPath === '/admin/login' || pathname?.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying administrative session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.adminWrapper}>
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brandLogoIcon} aria-hidden="true">
            <IconBrand />
          </div>
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
                <span className={styles.navIcon} aria-hidden="true">
                  <item.Icon />
                </span>
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

      <div className={styles.mainContainer}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.mobileToggle}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <IconMenu />
            </button>

            <div className={styles.breadcrumbs}>
              <span className={styles.breadcrumbRoot}>Console</span>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbCurrent}>
                {NAV_ITEMS.find((item) => item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href)))?.label || 'Overview'}
              </span>
            </div>

            <div className={styles.statusPill}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span>Operational</span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.themeToggleWrapper}>
              <ThemeToggle />
            </div>

            <div className={styles.userSection}>
              <div className={styles.userBadgeAvatar}>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.userDisplayName}>{user?.fullName || user?.username}</span>
                <span className={styles.roleBadge}>
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Operator'}
                </span>
              </div>
            </div>

            <button
              className={styles.logoutBtn}
              onClick={() => logout()}
              title="End session"
            >
              <IconLogout />
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
