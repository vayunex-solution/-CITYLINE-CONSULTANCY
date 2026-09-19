'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface JobItem {
  id: string;
  title: string;
  slug: string;
  category_id?: number;
  categoryName?: string;
  categorySlug?: string;
  location: string;
  employment_type?: string;
  employmentType?: string;
  status: string;
  is_featured?: boolean;
  isFeatured?: boolean;
  applicationCount?: number;
  created_at?: string;
  createdAt?: string;
  description?: string;
  requirements?: string;
}

interface CategoryOption {
  id: number;
  name: string;
  slug?: string;
  is_active?: boolean;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 1, name: 'Hotel Staff' },
  { id: 2, name: 'Cleaning' },
  { id: 3, name: 'Mason' },
  { id: 4, name: 'Steel Fixer' },
  { id: 5, name: 'Carpenter' },
  { id: 6, name: 'Bike Rider / Delivery Job' },
  { id: 7, name: 'Taxi Driver' },
  { id: 8, name: 'Truck Driver' },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [locations, setLocations] = useState<string[]>([
    'Dubai, UAE',
    'Abu Dhabi, UAE',
    'Sharjah, UAE',
    'Ajman, UAE',
    'Ras Al Khaimah, UAE',
    'Fujairah, UAE',
    'Umm Al Quwain, UAE',
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inline Quick Category Add State
  const [inlineCategoryOpen, setInlineCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatSubmitting, setNewCatSubmitting] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: 1,
    location: 'Dubai, UAE',
    employmentType: 'Full-time',
    status: 'active',
    isFeatured: false,
    description: '',
    requirements: '',
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch<JobItem[]>(`/admin/recruitment/jobs?${params.toString()}`);
      if (res.success) {
        setJobs(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job vacancies.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const catRes = await adminFetch<CategoryOption[]>('/admin/master/categories?includeInactive=false');
      if (catRes.success && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
      }
    } catch {
      // Keep defaults
    }

    try {
      const locRes = await adminFetch<any[]>('/admin/master/locations?includeInactive=false');
      if (locRes.success && locRes.data && locRes.data.length > 0) {
        setLocations(locRes.data.map((l: any) => l.name));
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchReferenceData();
  }, [fetchJobs, fetchReferenceData]);

  const handleCreateCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setNewCatSubmitting(true);
    setInlineCatError(null);
    try {
      const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await adminFetch<any>('/admin/master/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName.trim(),
          slug,
          isActive: true,
        }),
      });
      if (res.success && res.data) {
        const created = res.data;
        const newCatId = Number(created.id);
        const newCategoryObj = { ...created, id: newCatId };
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === newCatId);
          return exists ? prev : [...prev, newCategoryObj];
        });
        setFormData((prev) => ({ ...prev, categoryId: newCatId }));
        setInlineCategoryOpen(false);
        setNewCatName('');
        setNewCatSlug('');
        setSuccess(`Category "${created.name}" added and selected!`);
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err: any) {
      setInlineCatError(err.message || 'Failed to create category.');
    } finally {
      setNewCatSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      categoryId: categories[0]?.id || 1,
      location: 'Dubai, UAE',
      employmentType: 'Full-time',
      status: 'active',
      isFeatured: false,
      description: '',
      requirements: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (job: JobItem) => {
    setEditingId(job.id);
    setFormData({
      title: job.title,
      slug: job.slug,
      categoryId: Number(job.category_id || 1),
      location: job.location || 'Dubai, UAE',
      employmentType: job.employment_type || job.employmentType || 'Full-time',
      status: job.status || 'active',
      isFeatured: Boolean(job.is_featured || job.isFeatured),
      description: job.description || '',
      requirements: job.requirements || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }

    const catId = Number(formData.categoryId);
    const validCategoryId = !isNaN(catId) && catId > 0 ? catId : (categories[0]?.id || 1);
    const cleanSlug = (formData.slug.trim() || formData.title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'vacancy';

    const desc = formData.description.trim() || `${formData.title.trim()} vacancy in ${formData.location.trim()} — operational role and employment terms.`;
    const reqs = formData.requirements.trim() || 'Relevant commercial experience and valid legal UAE documentation.';

    setFormSubmitting(true);
    try {
      if (editingId) {
        await adminFetch(`/admin/recruitment/jobs/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title.trim(),
            categoryId: validCategoryId,
            location: formData.location.trim(),
            employmentType: formData.employmentType,
            status: formData.status,
            isFeatured: formData.isFeatured,
            description: desc,
            requirements: reqs,
          }),
        });
        setSuccess('Job vacancy updated successfully.');
      } else {
        await adminFetch('/admin/recruitment/jobs', {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title.trim(),
            slug: cleanSlug,
            categoryId: validCategoryId,
            location: formData.location.trim(),
            employmentType: formData.employmentType,
            status: formData.status,
            isFeatured: formData.isFeatured,
            description: desc,
            requirements: reqs,
          }),
        });
        setSuccess('New job vacancy created successfully.');
      }
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      fetchJobs();
    } catch (err: any) {
      if (err.fieldErrors && typeof err.fieldErrors === 'object') {
        const details = Object.entries(err.fieldErrors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        setError(`${err.message || 'Validation failed'}: ${details}`);
      } else {
        setError(err.message || 'Operation failed.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (job: JobItem, newStatus: string) => {
    try {
      await adminFetch(`/admin/recruitment/jobs/${job.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccess(`Job status updated to ${newStatus}.`);
      setTimeout(() => setSuccess(null), 3000);
      fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to update job status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this job vacancy?')) return;
    try {
      await adminFetch(`/admin/recruitment/jobs/${id}`, { method: 'DELETE' });
      setSuccess('Job vacancy archived.');
      setTimeout(() => setSuccess(null), 3000);
      fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to archive job.');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Job Vacancies</h1>
          <p className={styles.pageSubtitle}>
            Manage recruitment listings across the 8 approved UAE operational trades.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openCreateModal}>
            + Create Vacancy
          </button>
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
            placeholder="Search by job title or slug..."
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
            <option value="active">Active (Published)</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Showing {jobs.length} of {total} vacancies
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Applications</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loadingBox}>
                  Loading job vacancies...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyBox}>
                  No job vacancies found. Click &quot;+ Create Vacancy&quot; to publish an active opening.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{job.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      /jobs/{job.slug} {job.is_featured ? '• ⭐ Featured' : ''}
                    </div>
                  </td>
                  <td>{job.categoryName || 'Operational'}</td>
                  <td>{job.location}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        job.status === 'active'
                          ? styles.badgeSuccess
                          : job.status === 'draft'
                          ? styles.badgeNeutral
                          : job.status === 'paused'
                          ? styles.badgeWarning
                          : styles.badgeError
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{job.applicationCount || 0}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      {job.status === 'active' ? (
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleStatusChange(job, 'paused')}
                          title="Pause applicants"
                        >
                          Pause
                        </button>
                      ) : job.status === 'paused' || job.status === 'draft' ? (
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleStatusChange(job, 'active')}
                          title="Activate vacancy"
                        >
                          Activate
                        </button>
                      ) : null}

                      <button className={styles.btnSecondary} onClick={() => openEditModal(job)}>
                        Edit
                      </button>
                      <button className={styles.btnDanger} onClick={() => handleDelete(job.id)}>
                        Archive
                      </button>
                    </div>
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Edit Vacancy' : 'New Job Vacancy'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Job Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        title: val,
                        slug: !editingId ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : formData.slug,
                      });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className={styles.formLabel} style={{ marginBottom: 0 }}>Category *</label>
                    <button
                      type="button"
                      onClick={() => setInlineCategoryOpen(!inlineCategoryOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-gold-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {inlineCategoryOpen ? '✕ Close' : '+ Add New Category'}
                    </button>
                  </div>

                  {inlineCategoryOpen && (
                    <div
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-base)',
                        border: '1px solid var(--accent-gold-primary)',
                        marginBottom: 'var(--space-3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-gold-primary)' }}>
                        Quick Create Category
                      </div>
                      {inlineCatError && (
                        <div style={{ color: 'var(--status-error)', fontSize: '11px' }}>⚠️ {inlineCatError}</div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <input
                          type="text"
                          placeholder="Category Name"
                          className={styles.formInput}
                          value={newCatName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewCatName(val);
                            setNewCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          }}
                          style={{ fontSize: '12px', padding: '6px 8px' }}
                        />
                        <input
                          type="text"
                          placeholder="Slug"
                          className={styles.formInput}
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: '2px' }}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => { setInlineCategoryOpen(false); setInlineCatError(null); }}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={newCatSubmitting || !newCatName.trim()}
                          onClick={handleCreateCategoryInline}
                          style={{ fontSize: '11px', padding: '3px 12px' }}
                        >
                          {newCatSubmitting ? 'Saving...' : 'Save & Select'}
                        </button>
                      </div>
                    </div>
                  )}

                  <select
                    className={styles.formSelect}
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location *</label>
                  <input
                    type="text"
                    required
                    list="admin-master-locations"
                    className={styles.formInput}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <datalist id="admin-master-locations">
                    {locations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Employment Type</label>
                  <select
                    className={styles.formSelect}
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status *</label>
                  <select
                    className={styles.formSelect}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className={styles.formGrid1col}>
                  <label className={styles.formCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    Featured on Homepage
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter role responsibilities and operational expectations..."
                  className={styles.formTextarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Enter experience or legal UAE documentation (optional, standard terms apply if empty)..."
                  className={styles.formTextarea}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
