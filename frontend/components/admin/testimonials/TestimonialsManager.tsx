'use client';

/**
 * CITYLINE CONSULTANCY — Testimonials Management Component
 * Authenticated administration for client milestone accounts and reviews.
 * Uses centralized adminFetch with HttpOnly cookies, CSRF protection, and zero localStorage secrets.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
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
  const [testimonials, setTestimonials] = useState<AdminTestimonialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter === 'published') params.append('status', 'published');
      if (statusFilter === 'unpublished') params.append('status', 'unpublished');
      params.append('limit', '50');

      const res = await adminFetch<AdminTestimonialItem[]>(`/admin/testimonials?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setTestimonials(res.data);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load testimonials');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const openCreateModal = () => {
    setEditingId(null);
    const nextOrder =
      testimonials.length > 0
        ? Math.max(...testimonials.map((t) => t.displayOrder)) + 1
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

      if (editingId) {
        await adminFetch(`/admin/testimonials/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch('/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
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
      await adminFetch(`/admin/testimonials/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });

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

    const items = newOrderList.map((item, idx) => ({
      id: item.id,
      displayOrder: idx,
    }));

    try {
      await adminFetch('/admin/testimonials/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });

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
      await adminFetch(`/admin/testimonials/${deleteConfirmId}`, {
        method: 'DELETE',
      });

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

  const totalCount = testimonials.length;
  const publishedCount = testimonials.filter((t) => t.isPublished).length;
  const draftCount = testimonials.filter((t) => !t.isPublished).length;
  const avgRating = totalCount > 0
    ? (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.headerBadge}>
            <span>⭐ Client Feedback</span>
          </div>
          <h1 className={styles.title}>Testimonials Management</h1>
          <p className={styles.subtitle}>
            Curate and publish authentic, verified client reviews and company success milestones across UAE services.
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreateModal}>
          <span>+</span> Add Testimonial
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Reviews</span>
            <span className={styles.kpiValue}>{totalCount}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Published Live</span>
            <span className={styles.kpiValue}>{publishedCount}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Average Rating</span>
            <span className={styles.kpiValue}>{avgRating} / 5.0</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox} style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Draft / Pending</span>
            <span className={styles.kpiValue}>{draftCount}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles.alertError}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by client, company, quote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.statusFilterTabs}>
            <button
              className={`${styles.filterTab} ${statusFilter === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              className={`${styles.filterTab} ${statusFilter === 'published' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('published')}
            >
              Published ({publishedCount})
            </button>
            <button
              className={`${styles.filterTab} ${statusFilter === 'unpublished' ? styles.filterTabActive : ''}`}
              onClick={() => setStatusFilter('unpublished')}
            >
              Drafts ({draftCount})
            </button>
          </div>
        </div>

        <div className={styles.recordsCount}>
          Showing {testimonials.length} {testimonials.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Order</th>
                <th>Client / Organization</th>
                <th>Service Category</th>
                <th>Client Testimonial</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '170px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    Loading client testimonials from database...
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No testimonials found. Click &quot;+ Add Testimonial&quot; to publish verified client feedback.
                  </td>
                </tr>
              ) : (
                testimonials.map((item, index) => {
                  const initials = item.clientName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'CL';

                  return (
                    <tr key={item.id}>
                      {/* Order Controls */}
                      <td>
                        <div className={styles.orderCell}>
                          <span className={styles.orderBadge}>#{item.displayOrder}</span>
                          <div className={styles.orderControls}>
                            <button
                              className={styles.orderBtn}
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'up')}
                              title="Move up"
                              aria-label="Move up"
                            >
                              ▲
                            </button>
                            <button
                              className={styles.orderBtn}
                              disabled={index === testimonials.length - 1}
                              onClick={() => handleMoveOrder(index, 'down')}
                              title="Move down"
                              aria-label="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Client Info */}
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.clientAvatar}>
                            {initials}
                          </div>
                          <div className={styles.clientInfo}>
                            <span className={styles.clientName}>{item.clientName}</span>
                            <span className={styles.clientSubtitle}>
                              {[item.clientDesignation, item.companyName].filter(Boolean).join(' • ') || 'Verified Client'}
                            </span>
                            {item.clientLocation && (
                              <span className={styles.clientLocation}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }}>
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                </svg>
                                {item.clientLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Service Category */}
                      <td>
                        <span className={styles.categoryBadge}>
                          {item.serviceCategory || 'General'}
                        </span>
                      </td>

                      {/* Quote */}
                      <td>
                        <div className={styles.quoteCell}>
                          <p className={styles.quoteText} title={item.testimonialText}>
                            &ldquo;{item.testimonialText}&rdquo;
                          </p>
                        </div>
                      </td>

                      {/* Rating */}
                      <td>
                        <div className={styles.ratingCell}>
                          <span className={styles.stars}>{'★'.repeat(item.rating || 5)}</span>
                          <span className={styles.ratingScore}>{item.rating || 5}.0</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={item.isPublished ? styles.badgePublished : styles.badgeDraft}>
                          <span className={styles.statusDotLive} />
                          {item.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.btnActionToggle}
                            onClick={() => handleTogglePublish(item)}
                            title={item.isPublished ? 'Unpublish from website' : 'Publish to website'}
                          >
                            {item.isPublished ? 'Hide' : 'Publish'}
                          </button>
                          <button
                            className={styles.btnActionEdit}
                            onClick={() => openEditModal(item)}
                            title="Edit details"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.btnActionDelete}
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Archive"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                {editingId ? 'Edit Testimonial' : 'New Client Testimonial'}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>
                ✕
              </button>
            </div>

            {formError && (
              <div className={styles.alertError}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Client Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations Director"
                    value={formData.clientDesignation}
                    onChange={(e) => setFormData({ ...formData, clientDesignation: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Facilities Management LLC"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Business Bay, Dubai"
                    value={formData.clientLocation}
                    onChange={(e) => setFormData({ ...formData, clientLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Service Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Manpower Recruitment / 2-Year Freelance Visa"
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Client Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  >
                    <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                    <option value={4}>★★★★☆ (4 Stars - Highly Satisfied)</option>
                    <option value={3}>★★★☆☆ (3 Stars - Satisfied)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Testimonial Quote / Verification Text *</label>
                <textarea
                  required
                  placeholder="Enter the authentic, approved client review verbatim..."
                  value={formData.testimonialText}
                  onChange={(e) => setFormData({ ...formData, testimonialText: e.target.value })}
                />
              </div>

              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="publishLiveCheck"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <label htmlFor="publishLiveCheck" style={{ cursor: 'pointer' }}>
                  Publish live immediately on the public website
                </label>
              </div>

              <div className={styles.modalFooter}>
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
                  {formSubmitting ? 'Saving...' : editingId ? 'Update Testimonial' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {deleteConfirmId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.modalDialog} style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Archive Testimonial</h2>
              <button className={styles.closeBtn} onClick={() => setDeleteConfirmId(null)}>✕</button>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Are you sure you want to archive this testimonial? It will be safely removed from public visibility on the website.
            </p>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnDangerConfirm}
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
