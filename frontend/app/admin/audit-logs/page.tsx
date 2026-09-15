'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface AuditLogItem {
  id: number;
  actorAdminId?: string | null;
  actorUsername?: string | null;
  actorFullName?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  clientIp?: string | null;
  detailsJson?: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      if (resourceFilter.trim()) params.set('resourceType', resourceFilter.trim());
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<AuditLogItem[]>(`/admin/audit-logs?${params.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter, search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Immutable Audit Trail</h1>
          <p className={styles.pageSubtitle}>
            Administrative actions, state transitions, security events, and compliance records.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search action, resource ID, username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className={styles.filterSelect}
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Resource Domains</option>
            <option value="testimonial">Testimonials</option>
            <option value="visa_enquiry">Visa Enquiries</option>
            <option value="manpower_enquiry">Manpower Enquiries</option>
            <option value="job">Jobs</option>
            <option value="job_application">Applications</option>
            <option value="notification_queue">Notification Outbox</option>
            <option value="admin_user">Admin Authentication</option>
          </select>
          <input
            type="text"
            className={styles.searchInput}
            style={{ maxWidth: '200px' }}
            placeholder="Filter action (e.g. login)..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {items.length} of {total} audit records
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Resource Domain</th>
              <th>Actor</th>
              <th>Client IP</th>
              <th style={{ textAlign: 'right' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loadingBox}>
                  Querying audit log records...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyBox}>
                  No audit trail records found matching criteria.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeNew}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.resourceType}</span>
                    {log.resourceId && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        #{log.resourceId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div>{log.actorUsername || 'system'}</div>
                    {log.actorFullName && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {log.actorFullName}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {log.clientIp || 'internal'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.detailsJson ? (
                      <button className={styles.btnSecondary} onClick={() => setSelectedLog(log)}>
                        Inspect
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

      {/* Details Inspection Modal */}
      {selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Audit Event #{selectedLog.id} — {selectedLog.action}
              </h2>
              <button className={styles.closeBtn} onClick={() => setSelectedLog(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ marginBottom: 'var(--space-4)', fontSize: '12px' }}>
                <div><strong>Resource:</strong> {selectedLog.resourceType} ({selectedLog.resourceId || 'N/A'})</div>
                <div><strong>Actor:</strong> {selectedLog.actorUsername || 'system'} ({selectedLog.actorAdminId || 'N/A'})</div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toISOString()}</div>
                <div><strong>Client IP:</strong> {selectedLog.clientIp || 'internal'}</div>
              </div>

              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                Structured Details JSON
              </h3>
              <pre
                style={{
                  background: 'var(--surface-subtle)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.detailsJson || '{}'), null, 2);
                  } catch {
                    return selectedLog.detailsJson || '{}';
                  }
                })()}
              </pre>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
