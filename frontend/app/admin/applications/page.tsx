'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface ApplicationItem {
  id: string;
  applicant_name?: string;
  applicantName?: string;
  email: string;
  phone: string;
  nationality: string;
  current_location?: string;
  currentLocation?: string;
  years_experience?: number;
  yearsExperience?: number;
  status: string;
  job_title?: string;
  jobTitle?: string;
  created_at?: string;
  createdAt?: string;
}

interface ApplicationDetail {
  application: any;
  documents: Array<{
    id: string;
    document_category?: string;
    category?: string;
    original_filename?: string;
    filename?: string;
    file_size_bytes?: number;
    sizeBytes?: number;
    mime_type?: string;
    mimeType?: string;
    validation_status?: string;
    validationStatus?: string;
    malware_scan_status?: string;
    malwareScanStatus?: string;
  }>;
}

export default function AdminApplicationsPage() {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<ApplicationDetail | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<ApplicationItem[]>(`/admin/recruitment/applications?${params.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidate applications.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openDetail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await adminFetch<ApplicationDetail>(`/admin/recruitment/applications/${id}`);
      if (res.success && res.data) {
        setDetailData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!detailData?.application?.id) return;
    setUpdatingStatus(true);
    try {
      await adminFetch(`/admin/recruitment/applications/${detailData.application.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccess(`Application status changed to ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
      setDetailData({
        ...detailData,
        application: {
          ...detailData.application,
          status: newStatus,
        },
      });
      fetchApplications();
    } catch (err: any) {
      setError(err.message || 'Failed to update application status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Job Candidate Applications</h1>
          <p className={styles.pageSubtitle}>
            Candidate screening, experience vetting, and document verification for UAE operational trades.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
      {success && <div className={styles.successBanner}>✓ {success}</div>}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search candidate name, email, phone..."
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
            <option value="new">New (Pending Triage)</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {items.length} of {total} applications
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Applied Role</th>
              <th>Nationality</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loadingBox}>
                  Loading candidate applications...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyBox}>
                  No candidate applications found matching the criteria.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const name = item.applicant_name || item.applicantName || 'Applicant';
                const role = item.job_title || item.jobTitle || 'Operational Role';
                const date = item.created_at || item.createdAt || new Date().toISOString();
                const exp = item.years_experience ?? item.yearsExperience ?? 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.email} • {item.phone}
                      </div>
                    </td>
                    <td>{role}</td>
                    <td>{item.nationality}</td>
                    <td>{exp} {exp === 1 ? 'year' : 'years'}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          item.status === 'new'
                            ? styles.badgeNew
                            : item.status === 'shortlisted' || item.status === 'hired'
                            ? styles.badgeSuccess
                            : item.status === 'rejected'
                            ? styles.badgeError
                            : styles.badgeWarning
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(date).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={styles.btnSecondary} onClick={() => openDetail(item.id)}>
                        Review Profile
                      </button>
                    </td>
                  </tr>
                );
              })
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
              <h2 className={styles.modalTitle}>Candidate Application Details</h2>
              <button className={styles.closeBtn} onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>

            {detailLoading ? (
              <div className={styles.loadingBox}>Loading application details...</div>
            ) : detailData?.application ? (
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <strong>Candidate Name:</strong>
                    <div>{detailData.application.applicant_name || detailData.application.applicantName}</div>
                  </div>
                  <div>
                    <strong>Applied For:</strong>
                    <div>{detailData.application.job_title || detailData.application.jobTitle || 'General Vacancy'}</div>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <div>{detailData.application.email}</div>
                  </div>
                  <div>
                    <strong>Phone:</strong>
                    <div>{detailData.application.phone} {detailData.application.whatsapp ? `(WA: ${detailData.application.whatsapp})` : ''}</div>
                  </div>
                  <div>
                    <strong>Nationality:</strong>
                    <div>{detailData.application.nationality}</div>
                  </div>
                  <div>
                    <strong>Current Location:</strong>
                    <div>{detailData.application.current_location || detailData.application.currentLocation || 'Unspecified'}</div>
                  </div>
                  <div>
                    <strong>Years of Experience:</strong>
                    <div>{detailData.application.years_experience ?? detailData.application.yearsExperience} years</div>
                  </div>
                  <div>
                    <strong>Current Status:</strong>
                    <div>
                      <span className={`${styles.badge} ${styles.badgeNew}`}>
                        {detailData.application.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attached Documents */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Attached Curriculum Vitae & Certificates ({detailData.documents?.length || 0})
                  </h3>
                  {!detailData.documents || detailData.documents.length === 0 ? (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      No digital documents linked to this application.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {detailData.documents.map((doc) => {
                        const filename = doc.filename || doc.original_filename || 'Candidate_CV.pdf';
                        const size = doc.sizeBytes || doc.file_size_bytes || 0;
                        const scanStatus = doc.malwareScanStatus || doc.malware_scan_status || 'clean';
                        const valStatus = doc.validationStatus || doc.validation_status || 'valid';

                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: 'var(--space-2) var(--space-3)',
                              background: 'var(--surface-subtle)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--text-xs)',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600 }}>📄 {filename}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                                ({Math.round(size / 1024)} KB)
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <span className={`${styles.badge} ${scanStatus === 'clean' ? styles.badgeSuccess : styles.badgeWarning}`}>
                                Scan: {scanStatus}
                              </span>
                              <span className={`${styles.badge} ${valStatus === 'valid' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                                {valStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    🔒 Document filesystem keys are protected in accordance with privacy and storage policies. Public download access is prohibited.
                  </p>
                </div>

                {/* Status Update */}
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Triage Application Status
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {['new', 'reviewed', 'shortlisted', 'hired', 'rejected'].map((st) => (
                      <button
                        key={st}
                        className={detailData.application.status === st ? styles.btnPrimary : styles.btnSecondary}
                        disabled={updatingStatus || detailData.application.status === st}
                        onClick={() => handleStatusChange(st)}
                      >
                        Set {st.charAt(0).toUpperCase() + st.slice(1)}
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
