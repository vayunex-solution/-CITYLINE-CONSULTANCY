'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface NotificationItem {
  id: string;
  notificationType: string;
  referenceId: string;
  recipientEmail: string;
  subject: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'exhausted';
  retryCount: number;
  nextRetryAt: string;
  lastError?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Retry tracking
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<NotificationItem[]>(`/admin/notifications?${params.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification queue.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await adminFetch(`/admin/notifications/${id}/retry`, { method: 'POST' });
      setSuccess('Notification successfully re-queued for transmission.');
      setTimeout(() => setSuccess(null), 3000);
      fetchNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to retry notification.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Transactional Outbox Notification Queue</h1>
          <p className={styles.pageSubtitle}>
            Outbox queue diagnostics, retry states, and email transmission health. Credentials strictly redacted.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={fetchNotifications} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh Queue'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.successBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search recipient email, subject, or reference ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Queue Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent (Delivered)</option>
            <option value="failed">Failed (Retryable)</option>
            <option value="exhausted">Exhausted (Dead-letter)</option>
          </select>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {items.length} of {total} queue items
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Type / Reference</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Retries</th>
              <th>Queued / Sent</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loadingBox}>
                  Loading notification queue...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyBox}>
                  No notifications found matching current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.notificationType}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Ref: {item.referenceId.slice(0, 8)}...
                    </div>
                  </td>
                  <td>{item.recipientEmail}</td>
                  <td>
                    <div
                      style={{
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.subject}
                    >
                      {item.subject}
                    </div>
                    {item.lastError && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--status-error)',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.lastError}
                      >
                        Err: {item.lastError}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        item.status === 'sent'
                          ? styles.badgeSuccess
                          : item.status === 'pending'
                          ? styles.badgeWarning
                          : item.status === 'processing'
                          ? styles.badgeNew
                          : styles.badgeError
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.retryCount}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.sentAt
                      ? `Delivered: ${new Date(item.sentAt).toLocaleTimeString()}`
                      : `Queued: ${new Date(item.createdAt).toLocaleTimeString()}`}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.status === 'failed' || item.status === 'exhausted' ? (
                      <button
                        className={styles.btnSecondary}
                        disabled={retryingId === item.id}
                        onClick={() => handleRetry(item.id)}
                      >
                        {retryingId === item.id ? 'Requeuing...' : 'Retry Task'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className={styles.paginationBar}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className={styles.paginationBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className={styles.paginationBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
