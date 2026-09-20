'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch, adminPreviewDocument, adminDownloadDocument } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface VisaEnquiryItem {
  id: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality?: string;
  createdAt: string;
  durationDays?: number;
  applicantCount: number;
  intendedTravelDate?: string;
  serviceTitle?: string;
  documentCount: number;
}

interface DocumentMetadata {
  id: string;
  category: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  validationStatus: string;
  malwareScanStatus: string;
  createdAt: string;
}

interface DetailState {
  enquiry: any;
  documents: DocumentMetadata[];
}

export default function AdminVisaEnquiriesPage() {
  const [items, setItems] = useState<VisaEnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<DetailState | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeDocAction, setActiveDocAction] = useState<string | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<VisaEnquiryItem[]>(`/admin/visa-enquiries?${params.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch visa enquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const openDetail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await adminFetch<DetailState>(`/admin/visa-enquiries/${id}`);
      if (res.success && res.data) {
        setDetailData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load enquiry details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!detailData?.enquiry?.id) return;
    setUpdatingStatus(true);
    try {
      await adminFetch(`/admin/visa-enquiries/${detailData.enquiry.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setSuccess(`Status successfully changed to ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
      // Refresh modal state
      setDetailData({
        ...detailData,
        enquiry: {
          ...detailData.enquiry,
          status: newStatus,
        },
      });
      fetchEnquiries();
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePreviewDoc = async (docId: string) => {
    setActiveDocAction(`preview-${docId}`);
    try {
      await adminPreviewDocument(docId);
    } catch (err: any) {
      setError(err.message || 'Failed to open document preview.');
    } finally {
      setActiveDocAction(null);
    }
  };

  const handleDownloadDoc = async (docId: string, filename: string) => {
    setActiveDocAction(`download-${docId}`);
    try {
      await adminDownloadDocument(docId, filename);
    } catch (err: any) {
      setError(err.message || 'Failed to download document.');
    } finally {
      setActiveDocAction(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Visa Enquiry Review</h1>
          <p className={styles.pageSubtitle}>
            Triage, document security verification, and lifecycle management for UAE visa applications.
          </p>
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
            placeholder="Search by applicant name, email, phone, service..."
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
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="contacted">Contacted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {items.length} of {total} records
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Service</th>
              <th>Applicants</th>
              <th>Nationality</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.loadingBox}>
                  Loading visa enquiries...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyBox}>
                  No visa enquiries found matching the criteria.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.email} • {item.phone}
                    </div>
                  </td>
                  <td>{item.serviceTitle || 'General Consultation'}</td>
                  <td>{item.applicantCount}</td>
                  <td>{item.nationality || '—'}</td>
                  <td>
                    <span className={styles.badge} style={{ background: 'var(--surface-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      {item.documentCount} {item.documentCount === 1 ? 'file' : 'files'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        item.status === 'new'
                          ? styles.badgeNew
                          : item.status === 'completed'
                          ? styles.badgeSuccess
                          : item.status === 'rejected'
                          ? styles.badgeError
                          : styles.badgeWarning
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.btnSecondary} onClick={() => openDetail(item.id)}>
                      Review
                    </button>
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

      {/* Detail Modal */}
      {detailModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setDetailModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Enquiry & Consultation Details</h2>
              <button className={styles.closeBtn} onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>

            {detailLoading ? (
              <div className={styles.loadingBox}>Loading enquiry details...</div>
            ) : detailData?.enquiry ? (
              <div className={styles.modalBody}>
                {/* Applicant Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <strong>Applicant Name:</strong>
                    <div>{detailData.enquiry.fullName}</div>
                  </div>
                  <div>
                    <strong>Email Address:</strong>
                    <div>{detailData.enquiry.email}</div>
                  </div>
                  <div>
                    <strong>Contact Phone:</strong>
                    <div>{detailData.enquiry.phone} {detailData.enquiry.whatsapp ? `(WA: ${detailData.enquiry.whatsapp})` : ''}</div>
                  </div>
                  <div>
                    <strong>Nationality:</strong>
                    <div>{detailData.enquiry.nationality || 'Unspecified'}</div>
                  </div>
                  <div>
                    <strong>Service / Enquiry:</strong>
                    <div>{detailData.enquiry.serviceTitle || detailData.enquiry.subject || 'General Consultation'}</div>
                  </div>
                  <div>
                    <strong>Applicant Count:</strong>
                    <div>{detailData.enquiry.applicantCount}</div>
                  </div>
                  {detailData.enquiry.intendedTravelDate && (
                    <div>
                      <strong>Intended Travel:</strong>
                      <div>{detailData.enquiry.intendedTravelDate}</div>
                    </div>
                  )}
                  <div>
                    <strong>Current Status:</strong>
                    <div>
                      <span className={`${styles.badge} ${styles.badgeNew}`}>
                        {detailData.enquiry.status}
                      </span>
                    </div>
                  </div>
                </div>

                {detailData.enquiry.message && (
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <strong>Applicant Note / Message:</strong>
                    <p style={{ background: 'var(--surface-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-1)' }}>
                      {detailData.enquiry.message}
                    </p>
                  </div>
                )}

                {/* Secure Documents List */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Attached Documents ({detailData.documents.length})
                  </h3>
                  {detailData.documents.length === 0 ? (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      No uploaded documents attached to this enquiry.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {detailData.documents.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--surface-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-xs)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📄</span>
                              <span style={{ fontWeight: 600 }}>{doc.filename}</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px', display: 'flex', gap: '6px' }}>
                              <span>{Math.round(doc.sizeBytes / 1024)} KB</span>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize' }}>{doc.category}</span>
                              <span>•</span>
                              <span className={`${styles.badge} ${doc.malwareScanStatus === 'clean' ? styles.badgeSuccess : styles.badgeWarning}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Scan: {doc.malwareScanStatus}
                              </span>
                              <span className={`${styles.badge} ${doc.validationStatus === 'valid' ? styles.badgeSuccess : styles.badgeNeutral}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                {doc.validationStatus}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              style={{ fontSize: '11px', padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handlePreviewDoc(doc.id)}
                              disabled={activeDocAction === `preview-${doc.id}`}
                              title="Preview document in browser"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              {activeDocAction === `preview-${doc.id}` ? 'Opening...' : 'View'}
                            </button>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              style={{ fontSize: '11px', padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleDownloadDoc(doc.id, doc.filename)}
                              disabled={activeDocAction === `download-${doc.id}`}
                              title="Download original file"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              {activeDocAction === `download-${doc.id}` ? 'Downloading...' : 'Download'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Streamed securely through authenticated administrator tunnel with session isolation.</span>
                  </p>
                </div>

                {/* Status Transition UI */}
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Update Application Status
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {['new', 'in_progress', 'contacted', 'completed', 'rejected'].map((st) => (
                      <button
                        key={st}
                        className={detailData.enquiry.status === st ? styles.btnPrimary : styles.btnSecondary}
                        disabled={updatingStatus || detailData.enquiry.status === st}
                        onClick={() => handleStatusUpdate(st)}
                      >
                        Set {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
