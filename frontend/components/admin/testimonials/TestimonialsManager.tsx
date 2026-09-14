'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './TestimonialsAdmin.module.css';

export interface AdminTestimonialItem {
  id: string;
  clientName: string;
  clientDesignation: string | null;
  companyName: string | null;
  clientLocation: string | null;
  serviceCategory: string | null;
  testimonialText: string;
  rating: number | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormDataState {
  clientName: string;
  clientDesignation: string;
  companyName: string;
  clientLocation: string;
  serviceCategory: string;
  testimonialText: string;
  rating: number;
  displayOrder: number;
  isPublished: boolean;
}

const INITIAL_FORM: FormDataState = {
  clientName: '',
  clientDesignation: '',
  companyName: '',
  clientLocation: '',
  serviceCategory: '',
  testimonialText: '',
  rating: 5,
  displayOrder: 0,
  isPublished: false,
};

export function TestimonialsManager() {
  const [authToken, setAuthToken] = useState<string>('');
  const [testimonials, setTestimonials] = useState<AdminTestimonialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('clc_admin_token') || '';
      setAuthToken(savedToken);
    }
  }, []);

  const saveToken = (token: string) => {
    setAuthToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clc_admin_token', token);
    }
  };

  const getHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken.trim()) {
      headers['Authorization'] = `Bearer ${authToken.trim()}`;
    }
    return headers;
  }, [authToken]);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter === 'published') params.append('status', 'published');
      if (statusFilter === 'unpublished') params.append('status', 'unpublished');
      params.append('limit', '50');

      const res = await fetch(`${apiUrl}/admin/testimonials?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Enter a valid admin operator/super_admin bearer token.');
        }
        if (res.status === 403) {
          throw new Error('Insufficient permissions. Super Admin or Admin Operator role required.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Server returned ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTestimonials(json.data);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load testimonials');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, search, statusFilter]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const openCreateModal = () => {
    setEditingId(null);
    const nextOrder = testimonials.length > 0 
      ? Math.max(...testimonials.map(t => t.displayOrder)) + 1 
      : 0;
    setFormData({
      ...INITIAL_FORM,
      displayOrder: nextOrder,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AdminTestimonialItem) => {
    setEditingId(item.id);
    setFormData({
      clientName: item.clientName,
      clientDesignation: item.clientDesignation || '',
      companyName: item.companyName || '',
      clientLocation: item.clientLocation || '',
      serviceCategory: item.serviceCategory || '',
      testimonialText: item.testimonialText,
      rating: item.rating ? Number(item.rating) : 5,
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!formData.clientName.trim() || formData.clientName.trim().length < 2) {
      setFormError('Client name must be at least 2 characters.');
      return;
    }
    if (!formData.testimonialText.trim() || formData.testimonialText.trim().length < 10) {
      setFormError('Testimonial content must be at least 10 characters.');
      return;
    }

    setFormSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const payload = {
        clientName: formData.clientName.trim(),
        clientDesignation: formData.clientDesignation.trim() || null,
        companyName: formData.companyName.trim() || null,
        clientLocation: formData.clientLocation.trim() || null,
        serviceCategory: formData.serviceCategory.trim() || null,
        testimonialText: formData.testimonialText.trim(),
        rating: Number(formData.rating) || 5,
        displayOrder: Number(formData.displayOrder) || 0,
        isPublished: Boolean(formData.isPublished),
      };

      const url = editingId 
        ? `${apiUrl}/admin/testimonials/${editingId}`
        : `${apiUrl}/admin/testimonials`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Request failed with status ${res.status}`);
      }

      setSuccess(editingId ? 'Testimonial successfully updated.' : 'Testimonial created.');
      setTimeout(() => setSuccess(null), 4000);
      closeModal();
      await fetchTestimonials();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: AdminTestimonialItem) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/testimonials/${item.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to update publish state');
      }

      setSuccess(`Testimonial ${!item.isPublished ? 'published' : 'unpublished'}.`);
      setTimeout(() => setSuccess(null), 3000);
      await fetchTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === testimonials.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = testimonials[index];
    const target = testimonials[targetIndex];

    const newOrderList = [...testimonials];
    newOrderList[index] = target;
    newOrderList[targetIndex] = current;

    // Build reorder items array
    const items = newOrderList.map((item, idx) => ({
      id: item.id,
      displayOrder: idx,
    }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/testimonials/reorder`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to reorder testimonials');
      }

      setSuccess('Display order updated.');
      setTimeout(() => setSuccess(null), 3000);
      await fetchTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to save order');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/testimonials/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to archive testimonial');
      }

      setSuccess('Testimonial safely archived.');
      setTimeout(() => setSuccess(null), 3000);
      setDeleteConfirmId(null);
      await fetchTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to archive testimonial');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Testimonials Management</h1>
          <p className={styles.subtitle}>
            Admin curation for client milestone accounts and reviews. Strictly verified content only.
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreateModal}>
          + Create Testimonial
        </button>
      </div>

      {/* Auth Token Config Bar */}
      <div className={styles.authBar}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Admin Bearer Token:
        </span>
        <input
          type="password"
          placeholder="Paste admin operator or super_admin JWT token..."
          value={authToken}
          onChange={(e) => saveToken(e.target.value)}
        />
        <button
          className={styles.btnSecondary}
          onClick={() => fetchTestimonials()}
        >
          Refresh Data
        </button>
      </div>

      {/* Notifications */}
      {error && <div className={styles.alertError}>⚠️ {error}</div>}
      {success && <div className={styles.alertSuccess}>✓ {success}</div>}

      {/* Toolbar / Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by client, company, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Draft / Unpublished</option>
          </select>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {testimonials.length} {testimonials.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Order</th>
                <th>Client / Company</th>
                <th>Category</th>
                <th style={{ minWidth: '240px' }}>Testimonial Quote</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Loading testimonials...
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No testimonials found. Click &quot;+ Create Testimonial&quot; to add genuine, verified client feedback.
                  </td>
                </tr>
              ) : (
                testimonials.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.orderControls}>
                        <button
                          className={styles.orderBtn}
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          title="Move up"
                        >
                          ▲
                        </button>
                        <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>
                          {item.displayOrder}
                        </span>
                        <button
                          className={styles.orderBtn}
                          disabled={index === testimonials.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.clientName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {[item.clientDesignation, item.companyName, item.clientLocation]
                          .filter(Boolean)
                          .join(' • ') || '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.serviceCategory || 'General'}
                      </span>
                    </td>
                    <td>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                          maxWidth: '360px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        &ldquo;{item.testimonialText}&rdquo;
                      </p>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-gold-primary)', fontWeight: 600, fontSize: '12px' }}>
                        {'★'.repeat(item.rating || 5)}
                      </span>
                    </td>
                    <td>
                      <span className={item.isPublished ? styles.badgePublished : styles.badgeDraft}>
                        {item.isPublished ? '● Published' : '○ Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleTogglePublish(item)}
                          title={item.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {item.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Edit Testimonial' : 'New Testimonial'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>
                ✕
              </button>
            </div>

            {formError && <div className={styles.alertError}>⚠️ {formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.formLabel}>Client Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="e.g., Rajesh Sharma"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Designation / Role</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., Managing Partner"
                    value={formData.clientDesignation}
                    onChange={(e) => setFormData({ ...formData, clientDesignation: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Company Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., Apex Logistics LLC"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., Dubai, UAE / Mumbai, India"
                    value={formData.clientLocation}
                    onChange={(e) => setFormData({ ...formData, clientLocation: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Service Category</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., UAE Residency / Enterprise Setup"
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>Rating (1 - 5)</label>
                  <select
                    className={styles.formSelect}
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Display Order</label>
                  <input
                    type="number"
                    min={0}
                    className={styles.formInput}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    Publish immediately on public website
                  </label>
                </div>
                <div className={styles.formFull}>
                  <label className={styles.formLabel}>Testimonial Content *</label>
                  <textarea
                    required
                    rows={4}
                    className={styles.formTextarea}
                    placeholder="Enter the authentic, client-approved quote verbatim..."
                    value={formData.testimonialText}
                    onChange={(e) => setFormData({ ...formData, testimonialText: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Archive Testimonial</h2>
              <button className={styles.closeBtn} onClick={() => setDeleteConfirmId(null)}>✕</button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Are you sure you want to archive this testimonial? It will be safely removed from public visibility and marked as soft-deleted in the database.
            </p>
            <div className={styles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
