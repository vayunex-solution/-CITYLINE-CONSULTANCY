'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface ManpowerItem {
  id: string;
  reference_number?: string;
  referenceNumber?: string;
  company_name?: string;
  companyName?: string;
  contact_person?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  total_headcount?: number;
  totalHeadcount?: number;
  created_at?: string;
  createdAt?: string;
}

interface ManpowerDetail {
  id: string;
  reference_number?: string;
  status: string;
  company_name: string;
  trade_license_number?: string;
  trn?: string;
  industry?: string;
  contact_person: string;
  contact_designation?: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  total_headcount: number;
  deployment_location?: string;
  timeline?: string;
  special_requirements?: string;
  admin_notes?: string;
  created_at: string;
  positions: Array<{
    id: number;
    role_title: string;
    headcount: number;
    experience_years_required?: number;
    qualification?: string;
    salary_offered?: string;
    accommodation_provided?: boolean;
    transport_provided?: boolean;
    food_provided?: boolean;
    job_category_name?: string;
  }>;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ['reviewing', 'rejected', 'closed'],
  reviewing: ['contacted', 'rejected', 'closed'],
  contacted: ['qualified', 'rejected', 'closed'],
  qualified: ['processing', 'rejected', 'closed'],
  processing: ['fulfilled', 'closed'],
  fulfilled: ['closed'],
  rejected: ['closed'],
  closed: [],
};

export default function AdminManpowerPage() {
  const [items, setItems] = useState<ManpowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ManpowerDetail | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<ManpowerItem[]>(`/admin/manpower-enquiries?${params.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch manpower requisitions.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, cityFilter, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const openDetail = async (id: string) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await adminFetch<ManpowerDetail>(`/admin/manpower-enquiries/${id}`);
      if (res.success && res.data) {
        setDetail(res.data);
        setAdminNotes(res.data.admin_notes || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load requisition details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusTransition = async (targetStatus: string) => {
    if (!detail?.id) return;
    setUpdating(true);
    try {
      await adminFetch(`/admin/manpower-enquiries/${detail.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, adminNotes: adminNotes.trim() || undefined }),
      });
      setSuccess(`Status successfully transitioned to '${targetStatus}'.`);
      setTimeout(() => setSuccess(null), 3000);
      setDetail({
        ...detail,
        status: targetStatus,
      });
      fetchEnquiries();
    } catch (err: any) {
      setError(err.message || 'Transition rejected by state machine.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!detail?.id) return;
    setUpdating(true);
    try {
      await adminFetch(`/admin/manpower-enquiries/${detail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNotes: adminNotes.trim() }),
      });
      setSuccess('Operational notes updated.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update notes.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manpower Requisitions</h1>
          <p className={styles.pageSubtitle}>
            Corporate employer requirements, multi-role trade headcounts, and deployment state machine.
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
            placeholder="Search company, contact person, email, city..."
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
            <option value="reviewing">Reviewing</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="processing">Processing</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className={styles.filterSelect}
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Emirates / Cities</option>
            <option value="Dubai">Dubai</option>
            <option value="Abu Dhabi">Abu Dhabi</option>
            <option value="Sharjah">Sharjah</option>
            <option value="Ajman">Ajman</option>
            <option value="Ras Al Khaimah">Ras Al Khaimah</option>
            <option value="Fujairah">Fujairah</option>
            <option value="Umm Al Quwain">Umm Al Quwain</option>
          </select>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {items.length} of {total} requisitions
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reference / Company</th>
              <th>Contact Person</th>
              <th>Emirate</th>
              <th>Total Headcount</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.loadingBox}>
                  Loading manpower requisitions...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyBox}>
                  No employer requisitions found matching current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const ref = item.reference_number || item.referenceNumber || 'REF-MP';
                const comp = item.company_name || item.companyName || 'Corporate Employer';
                const contact = item.contact_person || item.contactPerson || 'Contact';
                const hc = item.total_headcount ?? item.totalHeadcount ?? 1;
                const date = item.created_at || item.createdAt || new Date().toISOString();

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{comp}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ref}
                      </div>
                    </td>
                    <td>
                      <div>{contact}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.email} • {item.phone}
                      </div>
                    </td>
                    <td>{item.city}</td>
                    <td>
                      <strong style={{ color: 'var(--accent-gold-primary)' }}>{hc}</strong> personnel
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          item.status === 'new'
                            ? styles.badgeNew
                            : item.status === 'fulfilled' || item.status === 'qualified'
                            ? styles.badgeSuccess
                            : item.status === 'rejected' || item.status === 'closed'
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
                        Inspect Requisition
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
          <div className={styles.modalDialog} style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Employer Manpower Requisition</h2>
              <button className={styles.closeBtn} onClick={() => setDetailModalOpen(false)}>✕</button>
            </div>

            {detailLoading ? (
              <div className={styles.loadingBox}>Loading requisition details...</div>
            ) : detail ? (
              <div className={styles.modalBody}>
                {/* Employer Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <div>
                    <strong>Company Name:</strong>
                    <div>{detail.company_name}</div>
                  </div>
                  <div>
                    <strong>Reference Number:</strong>
                    <div>{detail.reference_number || '—'}</div>
                  </div>
                  <div>
                    <strong>Trade License No:</strong>
                    <div>{detail.trade_license_number || '—'}</div>
                  </div>
                  <div>
                    <strong>Tax Registration (TRN):</strong>
                    <div>{detail.trn || '—'}</div>
                  </div>
                  <div>
                    <strong>Contact Person:</strong>
                    <div>{detail.contact_person} {detail.contact_designation ? `(${detail.contact_designation})` : ''}</div>
                  </div>
                  <div>
                    <strong>Contact Channels:</strong>
                    <div>{detail.email} • {detail.phone}</div>
                  </div>
                  <div>
                    <strong>City / Location:</strong>
                    <div>{detail.city}, UAE</div>
                  </div>
                  <div>
                    <strong>Total Headcount:</strong>
                    <div><strong style={{ color: 'var(--accent-gold-primary)' }}>{detail.total_headcount}</strong> personnel</div>
                  </div>
                </div>

                {/* Positions Breakdown */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Positions Breakdown ({detail.positions?.length || 0} Trades)
                  </h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Role Title</th>
                          <th>Category</th>
                          <th>Count</th>
                          <th>Min Experience</th>
                          <th>Provisions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.positions?.map((pos) => (
                          <tr key={pos.id}>
                            <td style={{ fontWeight: 600 }}>{pos.role_title}</td>
                            <td>{pos.job_category_name || 'Operational'}</td>
                            <td>{pos.headcount}</td>
                            <td>{pos.experience_years_required ? `${pos.experience_years_required} yrs` : 'Entry'}</td>
                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {[
                                pos.accommodation_provided ? 'Accomm' : null,
                                pos.transport_provided ? 'Trans' : null,
                                pos.food_provided ? 'Food' : null,
                              ].filter(Boolean).join(' • ') || 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operational Notes */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    Operational & Dispatch Notes
                  </h3>
                  <textarea
                    rows={3}
                    className={styles.formTextarea}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal recruiter coordination notes..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button className={styles.btnSecondary} onClick={handleSaveNotes} disabled={updating}>
                      Save Notes
                    </button>
                  </div>
                </div>

                {/* Status State Machine Transitions */}
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    State Machine Transition (Current: <span style={{ color: 'var(--accent-gold-primary)' }}>{detail.status}</span>)
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {(ALLOWED_TRANSITIONS[detail.status] || []).length === 0 ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        This requisition is in terminal state ({detail.status}). No further state transitions permitted.
                      </p>
                    ) : (
                      ALLOWED_TRANSITIONS[detail.status].map((target) => (
                        <button
                          key={target}
                          className={styles.btnPrimary}
                          disabled={updating}
                          onClick={() => handleStatusTransition(target)}
                        >
                          Transition to {target.replace('_', ' ')} →
                        </button>
                      ))
                    )}
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
