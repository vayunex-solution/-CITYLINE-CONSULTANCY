'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface DashboardData {
  enquiries: {
    total: number;
    new: number;
    visaTotal: number;
    visaNew: number;
    manpowerTotal: number;
    manpowerNew: number;
  };
  recruitment: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    newApplications: number;
  };
  testimonials: {
    total: number;
    published: number;
  };
  notificationQueue: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    exhausted: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    status?: string;
    actor?: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<DashboardData>('/admin/dashboard/stats');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Failed to retrieve dashboard metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to dashboard API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Operational Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Consolidated operational health, enquiry volume, recruitment pipelines, and outbox status.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={fetchStats} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh Metrics'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </span>
          <button className={styles.btnSecondary} onClick={fetchStats}>Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className={styles.loadingBox}>
          <p>Loading real-time operational statistics...</p>
        </div>
      )}

      {/* Dashboard Content */}
      {data && (
        <>
          {/* KPI Summary Grid */}
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Enquiries</span>
              <span className={styles.statValue}>{data.enquiries.total}</span>
              <span className={styles.statSub}>
                <strong style={{ color: data.enquiries.new > 0 ? 'var(--status-warning)' : 'inherit' }}>
                  {data.enquiries.new} new / pending
                </strong>
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Visa Applications</span>
              <span className={styles.statValue}>{data.enquiries.visaTotal}</span>
              <span className={styles.statSub}>
                {data.enquiries.visaNew} requiring initial review
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Manpower Requisitions</span>
              <span className={styles.statValue}>{data.enquiries.manpowerTotal}</span>
              <span className={styles.statSub}>
                {data.enquiries.manpowerNew} active employer submissions
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Active Job Vacancies</span>
              <span className={styles.statValue}>{data.recruitment.activeJobs}</span>
              <span className={styles.statSub}>
                {data.recruitment.totalJobs} total cataloged vacancies
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Candidate Applications</span>
              <span className={styles.statValue}>{data.recruitment.totalApplications}</span>
              <span className={styles.statSub}>
                <strong style={{ color: data.recruitment.newApplications > 0 ? 'var(--status-info)' : 'inherit' }}>
                  {data.recruitment.newApplications} awaiting triage
                </strong>
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Client Testimonials</span>
              <span className={styles.statValue}>{data.testimonials.published}</span>
              <span className={styles.statSub}>
                {data.testimonials.total} total curated reviews
              </span>
            </div>
          </div>

          {/* Secondary Operational Panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* Notification Outbox Health */}
            <div
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                  Notification Outbox Health
                </h2>
                <Link href="/admin/notifications" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', textDecoration: 'none' }}>
                  View Queue →
                </Link>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  Sent: {data.notificationQueue.sent}
                </span>
                <span className={`${styles.badge} ${styles.badgeWarning}`}>
                  Pending: {data.notificationQueue.pending}
                </span>
                <span className={`${styles.badge} ${styles.badgeNew}`}>
                  Processing: {data.notificationQueue.processing}
                </span>
                {data.notificationQueue.failed > 0 && (
                  <span className={`${styles.badge} ${styles.badgeError}`}>
                    Failed: {data.notificationQueue.failed}
                  </span>
                )}
                {data.notificationQueue.exhausted > 0 && (
                  <span className={`${styles.badge} ${styles.badgeError}`}>
                    Exhausted: {data.notificationQueue.exhausted}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-4)', lineHeight: 1.5 }}>
                {data.notificationQueue.failed === 0 && data.notificationQueue.exhausted === 0
                  ? 'All transactional email tasks are dispatching with normal delivery health.'
                  : 'Notice: One or more notification tasks have encountered failures.'}
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}
            >
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-4) 0' }}>
                Operational Navigation
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <Link href="/admin/visa-enquiries" className={styles.btnSecondary}>
                  Review Visas
                </Link>
                <Link href="/admin/jobs" className={styles.btnSecondary}>
                  Create Vacancy
                </Link>
                <Link href="/admin/applications" className={styles.btnSecondary}>
                  Triage CVs
                </Link>
                <Link href="/admin/manpower" className={styles.btnSecondary}>
                  Manpower Enquiries
                </Link>
                <Link href="/admin/testimonials" className={styles.btnSecondary}>
                  Curate Reviews
                </Link>
                <Link href="/admin/analytics" className={styles.btnSecondary}>
                  Visitor Intelligence
                </Link>
                <Link href="/admin/audit-logs" className={styles.btnSecondary}>
                  Inspect Audit Logs
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity Stream */}
          <div
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-4) 0' }}>
              Recent Incoming Inquiries & Candidate Activity
            </h2>

            {data.recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-6)' }}>
                No recent activity recorded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {data.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                        ({item.type.replace('_', ' ')})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {item.status && (
                        <span className={`${styles.badge} ${item.status === 'new' ? styles.badgeNew : styles.badgeNeutral}`}>
                          {item.status}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
