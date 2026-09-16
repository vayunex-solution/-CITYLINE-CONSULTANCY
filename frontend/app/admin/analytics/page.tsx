'use client';

/**
 * CITYLINE CONSULTANCY — Phase 12 Admin Analytics & Visitor Intelligence
 * Interactive reporting console displaying server-aggregated traffic, visitor volume,
 * device distributions, referral sources, and genuine enquiry conversion funnels.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import common from '@/components/admin/common/AdminCommon.module.css';

interface AnalyticsData {
  period: string;
  timeframe: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalVisitors: number;
    totalPageViews: number;
    uniqueVisitors: number;
    conversionRate: number;
    totalConversions: number;
  };
  conversions: {
    visaEnquiries: number;
    manpowerEnquiries: number;
    jobApplications: number;
    total: number;
  };
  topPages: Array<{ path: string; views: number }>;
  trafficSources: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  recentTrend: Array<{ date: string; views: number; visitors: number }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AnalyticsData>(`/admin/analytics/overview?period=${period}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Failed to retrieve analytics metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the analytics intelligence service.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div>
      {/* Header */}
      <div className={common.pageHeader}>
        <div>
          <h1 className={common.pageTitle}>Visitor Intelligence & Traffic Analytics</h1>
          <p className={common.pageSubtitle}>
            First-party, privacy-preserving website traffic telemetry and enquiry conversion metrics.
          </p>
        </div>
        <div className={common.headerActions}>
          <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--surface-elevated)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {(['today', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: period === p ? 'var(--brand-primary, #0066cc)' : 'transparent',
                  color: period === p ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={common.secondaryBtn}
            onClick={fetchAnalytics}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={common.errorBanner}>
          <span>⚠️ {error}</span>
          <button type="button" onClick={fetchAnalytics} className={common.secondaryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className={common.loadingState}>
          <p>Compiling server-side analytics telemetry...</p>
        </div>
      )}

      {/* Analytics Content */}
      {data && (
        <>
          {/* Top KPI Cards */}
          <div className={common.statGrid}>
            <div className={common.statCard}>
              <span className={common.statLabel}>Total Page Views</span>
              <span className={common.statValue}>{data.metrics.totalPageViews.toLocaleString()}</span>
              <span className={common.statSub}>
                {period === 'today' ? 'Recorded today' : `Across selected ${period} timeframe`}
              </span>
            </div>

            <div className={common.statCard}>
              <span className={common.statLabel}>Unique Visitors</span>
              <span className={common.statValue}>{data.metrics.uniqueVisitors.toLocaleString()}</span>
              <span className={common.statSub}>
                Anonymous first-party visitor sessions
              </span>
            </div>

            <div className={common.statCard}>
              <span className={common.statLabel}>Genuine Conversions</span>
              <span className={common.statValue} style={{ color: 'var(--success, #10b981)' }}>
                {data.conversions.total.toLocaleString()}
              </span>
              <span className={common.statSub}>
                Persisted enquiries and candidate applications
              </span>
            </div>

            <div className={common.statCard}>
              <span className={common.statLabel}>Conversion Rate</span>
              <span className={common.statValue}>
                {data.metrics.conversionRate}%
              </span>
              <span className={common.statSub}>
                Submissions relative to total visitors
              </span>
            </div>
          </div>

          {/* Detailed Metric Breakdowns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Top Visited Pages */}
            <div className={common.tableCard}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Top Visited Pages
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ranked by view volume</span>
              </div>
              {data.topPages.length === 0 ? (
                <div className={common.emptyState} style={{ padding: 'var(--space-8)' }}>
                  <p>No page views recorded in this timeframe.</p>
                </div>
              ) : (
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>Page Path</th>
                      <th style={{ textAlign: 'right' }}>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                          {p.path}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {p.views.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Referrer & Traffic Sources */}
            <div className={common.tableCard}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Traffic &amp; Referrer Sources
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sanitized domain origins</span>
              </div>
              {data.trafficSources.length === 0 ? (
                <div className={common.emptyState} style={{ padding: 'var(--space-8)' }}>
                  <p>No traffic source data available.</p>
                </div>
              ) : (
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th style={{ textAlign: 'right' }}>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trafficSources.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {t.source}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {t.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Secondary Grid: Device Categories & Conversion Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Device Categories */}
            <div className={common.tableCard}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Device Breakdown
                </h3>
              </div>
              {data.deviceBreakdown.length === 0 ? (
                <div className={common.emptyState} style={{ padding: 'var(--space-8)' }}>
                  <p>No device classification data available.</p>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {data.deviceBreakdown.map((d, idx) => {
                    const totalDev = data.deviceBreakdown.reduce((sum, item) => sum + item.count, 0) || 1;
                    const pct = Math.round((d.count / totalDev) * 100);
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {d.device === 'desktop' ? 'Desktop' : d.device === 'mobile' ? 'Mobile' : 'Tablet'} ({d.device})
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {d.count.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--surface-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-primary, #0066cc)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Conversions Details */}
            <div className={common.tableCard}>
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Conversion Channels (Persisted Records)
                </h3>
              </div>
              <div style={{ padding: 'var(--space-5)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--surface-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    VISA ENQUIRIES
                  </span>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.conversions.visaEnquiries.toLocaleString()}
                  </span>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    MANPOWER
                  </span>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.conversions.manpowerEnquiries.toLocaleString()}
                  </span>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    JOB APPS
                  </span>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.conversions.jobApplications.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)' }}>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Conversion figures strictly reflect verified database submissions. Mere button clicks without submission are excluded.
                </p>
              </div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className={common.tableCard}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Daily Telemetry Trend
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Page views & unique sessions</span>
            </div>
            {data.recentTrend.length === 0 ? (
              <div className={common.emptyState} style={{ padding: 'var(--space-8)' }}>
                <p>No activity logged during this timeframe.</p>
              </div>
            ) : (
              <table className={common.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Page Views</th>
                    <th style={{ textAlign: 'right' }}>Unique Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTrend.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.date}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.views.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{row.visitors.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
