'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

type MasterTab = 'categories' | 'locations' | 'visas' | 'industries';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  job_count?: number;
}

interface LocationItem {
  id: number;
  name: string;
  city: string;
  country: string;
  display_order: number;
  is_active: boolean;
}

interface VisaItem {
  id: number;
  service_code: string;
  title: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface IndustryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<MasterTab>('categories');

  // Data states
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [visas, setVisas] = useState<VisaItem[]>([]);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Generic form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    city: '',
    country: 'UAE',
    displayOrder: 0,
    isActive: true,
  });

  const [visaForm, setVisaForm] = useState({
    title: '',
    serviceCode: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const [industryForm, setIndustryForm] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const showNotification = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, locRes, visaRes, indRes] = await Promise.all([
        adminFetch<CategoryItem[]>('/admin/master/categories?includeInactive=true').catch(() => ({ success: false, data: [] })),
        adminFetch<LocationItem[]>('/admin/master/locations?includeInactive=true').catch(() => ({ success: false, data: [] })),
        adminFetch<VisaItem[]>('/admin/master/visa-services?includeInactive=true').catch(() => ({ success: false, data: [] })),
        adminFetch<IndustryItem[]>('/admin/master/industries?includeInactive=true').catch(() => ({ success: false, data: [] })),
      ]);

      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (locRes.success && locRes.data) setLocations(locRes.data);
      if (visaRes.success && visaRes.data) setVisas(visaRes.data);
      if (indRes.success && indRes.data) setIndustries(indRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch master data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Open modal handler
  const handleOpenCreateModal = () => {
    setEditingId(null);
    if (activeTab === 'categories') {
      setCategoryForm({ name: '', slug: '', description: '', displayOrder: categories.length + 1, isActive: true });
    } else if (activeTab === 'locations') {
      setLocationForm({ name: '', city: '', country: 'UAE', displayOrder: locations.length + 1, isActive: true });
    } else if (activeTab === 'visas') {
      setVisaForm({ title: '', serviceCode: '', slug: '', description: '', displayOrder: visas.length + 1, isActive: true });
    } else if (activeTab === 'industries') {
      setIndustryForm({ name: '', slug: '', description: '', displayOrder: industries.length + 1, isActive: true });
    }
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'categories') {
      setCategoryForm({
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        displayOrder: item.display_order ?? 0,
        isActive: Boolean(item.is_active),
      });
    } else if (activeTab === 'locations') {
      setLocationForm({
        name: item.name,
        city: item.city || '',
        country: item.country || 'UAE',
        displayOrder: item.display_order ?? 0,
        isActive: Boolean(item.is_active),
      });
    } else if (activeTab === 'visas') {
      setVisaForm({
        title: item.title,
        serviceCode: item.service_code,
        slug: item.slug,
        description: item.description || '',
        displayOrder: item.display_order ?? 0,
        isActive: Boolean(item.is_active),
      });
    } else if (activeTab === 'industries') {
      setIndustryForm({
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        displayOrder: item.display_order ?? 0,
        isActive: Boolean(item.is_active),
      });
    }
    setModalOpen(true);
  };

  // Submit modal form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);

    try {
      if (activeTab === 'categories') {
        const payload = {
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim().toLowerCase(),
          description: categoryForm.description.trim() || null,
          displayOrder: Number(categoryForm.displayOrder),
          isActive: categoryForm.isActive,
        };
        if (editingId) {
          await adminFetch(`/admin/master/categories/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
          showNotification(`Category "${payload.name}" updated successfully.`);
        } else {
          await adminFetch('/admin/master/categories', { method: 'POST', body: JSON.stringify(payload) });
          showNotification(`Category "${payload.name}" created successfully.`);
        }
      } else if (activeTab === 'locations') {
        const payload = {
          name: locationForm.name.trim(),
          city: locationForm.city.trim(),
          country: locationForm.country.trim(),
          displayOrder: Number(locationForm.displayOrder),
          isActive: locationForm.isActive,
        };
        if (editingId) {
          await adminFetch(`/admin/master/locations/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
          showNotification(`Location "${payload.name}" updated successfully.`);
        } else {
          await adminFetch('/admin/master/locations', { method: 'POST', body: JSON.stringify(payload) });
          showNotification(`Location "${payload.name}" created successfully.`);
        }
      } else if (activeTab === 'visas') {
        const payload = {
          title: visaForm.title.trim(),
          serviceCode: visaForm.serviceCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          slug: visaForm.slug.trim().toLowerCase(),
          description: visaForm.description.trim() || null,
          displayOrder: Number(visaForm.displayOrder),
          isActive: visaForm.isActive,
        };
        if (editingId) {
          await adminFetch(`/admin/master/visa-services/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
          showNotification(`Visa service "${payload.title}" updated successfully.`);
        } else {
          await adminFetch('/admin/master/visa-services', { method: 'POST', body: JSON.stringify(payload) });
          showNotification(`Visa service "${payload.title}" created successfully.`);
        }
      } else if (activeTab === 'industries') {
        const payload = {
          name: industryForm.name.trim(),
          slug: industryForm.slug.trim().toLowerCase(),
          description: industryForm.description.trim() || null,
          displayOrder: Number(industryForm.displayOrder),
          isActive: industryForm.isActive,
        };
        if (editingId) {
          await adminFetch(`/admin/master/industries/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
          showNotification(`Industry sector "${payload.name}" updated successfully.`);
        } else {
          await adminFetch('/admin/master/industries', { method: 'POST', body: JSON.stringify(payload) });
          showNotification(`Industry sector "${payload.name}" created successfully.`);
        }
      }

      setModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please verify input.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status toggle
  const handleToggleActive = async (endpoint: string, id: number, currentStatus: boolean, title: string) => {
    try {
      await adminFetch(`/admin/master/${endpoint}/${id}/toggle`, { method: 'PATCH' });
      showNotification(`"${title}" ${!currentStatus ? 'activated' : 'deactivated'}.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status.');
    }
  };

  // Delete
  const handleDelete = async (endpoint: string, id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await adminFetch(`/admin/master/${endpoint}/${id}`, { method: 'DELETE' });
      showNotification(`"${title}" deleted successfully.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item.');
    }
  };

  // Filtering
  const filteredCategories = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.is_active : !c.is_active);
    return matchesSearch && matchesStatus;
  });

  const filteredLocations = locations.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? l.is_active : !l.is_active);
    return matchesSearch && matchesStatus;
  });

  const filteredVisas = visas.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || v.service_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? v.is_active : !v.is_active);
    return matchesSearch && matchesStatus;
  });

  const filteredIndustries = industries.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? i.is_active : !i.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Master Tables & System Reference</h1>
          <p className={styles.pageSubtitle}>
            Manage standardized categories, operational deployment locations, visa services, and corporate industry sectors.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={fetchAllData} disabled={loading}>
            ↻ Refresh
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreateModal}>
            + Add{' '}
            {activeTab === 'categories'
              ? 'Category'
              : activeTab === 'locations'
              ? 'Location'
              : activeTab === 'visas'
              ? 'Visa Service'
              : 'Industry'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button className={styles.btnSecondary} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      {success && <div className={styles.successBanner}>✓ {success}</div>}

      {/* KPI Stats Grid */}
      <div className={styles.statGrid}>
        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: activeTab === 'categories' ? 'var(--accent-gold-primary)' : undefined }}
          onClick={() => setActiveTab('categories')}
        >
          <span className={styles.statLabel}>Job Categories</span>
          <span className={styles.statValue}>{categories.length}</span>
          <span className={styles.statSub}>{categories.filter((c) => c.is_active).length} Active Trades</span>
        </div>

        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: activeTab === 'locations' ? 'var(--accent-gold-primary)' : undefined }}
          onClick={() => setActiveTab('locations')}
        >
          <span className={styles.statLabel}>Job Locations</span>
          <span className={styles.statValue}>{locations.length}</span>
          <span className={styles.statSub}>{locations.filter((l) => l.is_active).length} Active Emirates / Cities</span>
        </div>

        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: activeTab === 'visas' ? 'var(--accent-gold-primary)' : undefined }}
          onClick={() => setActiveTab('visas')}
        >
          <span className={styles.statLabel}>Visa Offerings</span>
          <span className={styles.statValue}>{visas.length}</span>
          <span className={styles.statSub}>{visas.filter((v) => v.is_active).length} Active Services</span>
        </div>

        <div
          className={styles.statCard}
          style={{ cursor: 'pointer', borderColor: activeTab === 'industries' ? 'var(--accent-gold-primary)' : undefined }}
          onClick={() => setActiveTab('industries')}
        >
          <span className={styles.statLabel}>Industry Sectors</span>
          <span className={styles.statValue}>{industries.length}</span>
          <span className={styles.statSub}>{industries.filter((i) => i.is_active).length} Corporate Sectors</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('categories');
            setSearchTerm('');
          }}
        >
          🏷️ Job Categories ({categories.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'locations' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('locations');
            setSearchTerm('');
          }}
        >
          📍 Operational Locations ({locations.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'visas' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('visas');
            setSearchTerm('');
          }}
        >
          🛂 Visa Services ({visas.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'industries' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('industries');
            setSearchTerm('');
          }}
        >
          🏢 Industry Sectors ({industries.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingBox}>Loading master records...</div>
        ) : activeTab === 'categories' ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Order</th>
                <th>Active Vacancies</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyBox}>
                    No categories found. Click &quot;+ Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <code>{c.slug}</code>
                    </td>
                    <td style={{ maxWidth: '280px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {c.description || '—'}
                    </td>
                    <td>{c.display_order}</td>
                    <td>
                      <span className={`${styles.badge} ${c.job_count && c.job_count > 0 ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {c.job_count || 0} jobs
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${c.is_active ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleToggleActive('categories', c.id, c.is_active, c.name)}
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className={styles.btnSecondary} onClick={() => handleOpenEditModal(c)}>
                          Edit
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleDelete('categories', c.id, c.name)}
                          title="Delete category"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : activeTab === 'locations' ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Location Display</th>
                <th>City</th>
                <th>Country</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyBox}>
                    No locations found. Click &quot;+ Add Location&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id}>
                    <td>#{loc.id}</td>
                    <td>
                      <strong>{loc.name}</strong>
                    </td>
                    <td>{loc.city}</td>
                    <td>{loc.country}</td>
                    <td>{loc.display_order}</td>
                    <td>
                      <span className={`${styles.badge} ${loc.is_active ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {loc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleToggleActive('locations', loc.id, loc.is_active, loc.name)}
                        >
                          {loc.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className={styles.btnSecondary} onClick={() => handleOpenEditModal(loc)}>
                          Edit
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleDelete('locations', loc.id, loc.name)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : activeTab === 'visas' ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Service Title</th>
                <th>Code</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisas.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyBox}>
                    No visa services found. Click &quot;+ Add Visa Service&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredVisas.map((v) => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td>
                      <strong>{v.title}</strong>
                    </td>
                    <td>
                      <code>{v.service_code}</code>
                    </td>
                    <td>
                      <code>{v.slug}</code>
                    </td>
                    <td>{v.display_order}</td>
                    <td>
                      <span className={`${styles.badge} ${v.is_active ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleToggleActive('visa-services', v.id, v.is_active, v.title)}
                        >
                          {v.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className={styles.btnSecondary} onClick={() => handleOpenEditModal(v)}>
                          Edit
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleDelete('visa-services', v.id, v.title)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Industry Sector</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndustries.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyBox}>
                    No industry sectors found. Click &quot;+ Add Industry&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredIndustries.map((ind) => (
                  <tr key={ind.id}>
                    <td>#{ind.id}</td>
                    <td>
                      <strong>{ind.name}</strong>
                    </td>
                    <td>
                      <code>{ind.slug}</code>
                    </td>
                    <td style={{ maxWidth: '280px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {ind.description || '—'}
                    </td>
                    <td>{ind.display_order}</td>
                    <td>
                      <span className={`${styles.badge} ${ind.is_active ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {ind.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.btnSecondary}
                          onClick={() => handleToggleActive('industries', ind.id, ind.is_active, ind.name)}
                        >
                          {ind.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className={styles.btnSecondary} onClick={() => handleOpenEditModal(ind)}>
                          Edit
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleDelete('industries', ind.id, ind.name)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Edit ' : 'New '}
                {activeTab === 'categories'
                  ? 'Job Category'
                  : activeTab === 'locations'
                  ? 'Operational Location'
                  : activeTab === 'visas'
                  ? 'Visa Service'
                  : 'Industry Sector'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* Category Form */}
              {activeTab === 'categories' && (
                <>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category Name *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. Security Guard"
                        value={categoryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCategoryForm({
                            ...categoryForm,
                            name: val,
                            slug: !editingId
                              ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                              : categoryForm.slug,
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
                        placeholder="e.g. security-guard"
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Display Order</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={categoryForm.displayOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formCheckboxLabel} style={{ paddingTop: '28px' }}>
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                        />
                        Active (Visible in Career postings)
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description (Optional)</label>
                    <textarea
                      rows={2}
                      className={styles.formTextarea}
                      placeholder="Brief overview of operational roles in this category..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Location Form */}
              {activeTab === 'locations' && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Location Name *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. Dubai, UAE"
                      value={locationForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parts = val.split(',');
                        setLocationForm({
                          ...locationForm,
                          name: val,
                          city: parts[0]?.trim() || val,
                        });
                      }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. Dubai"
                      value={locationForm.city}
                      onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Country *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. UAE"
                      value={locationForm.country}
                      onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Display Order</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={locationForm.displayOrder}
                      onChange={(e) => setLocationForm({ ...locationForm, displayOrder: Number(e.target.value) })}
                    />
                  </div>

                  <div className={styles.formGrid1col}>
                    <label className={styles.formCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={locationForm.isActive}
                        onChange={(e) => setLocationForm({ ...locationForm, isActive: e.target.checked })}
                      />
                      Active for Vacancies and Deployment
                    </label>
                  </div>
                </div>
              )}

              {/* Visa Form */}
              {activeTab === 'visas' && (
                <>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Service Title *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. 5-Year Green Residency Visa"
                        value={visaForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVisaForm({
                            ...visaForm,
                            title: val,
                            slug: !editingId
                              ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                              : visaForm.slug,
                            serviceCode: !editingId
                              ? val.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 45)
                              : visaForm.serviceCode,
                          });
                        }}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Service Code *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. green_visa_5yr"
                        value={visaForm.serviceCode}
                        onChange={(e) => setVisaForm({ ...visaForm, serviceCode: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>URL Slug *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. 5-year-green-visa"
                        value={visaForm.slug}
                        onChange={(e) => setVisaForm({ ...visaForm, slug: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Display Order</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={visaForm.displayOrder}
                        onChange={(e) => setVisaForm({ ...visaForm, displayOrder: Number(e.target.value) })}
                      />
                    </div>

                    <div className={styles.formGrid1col}>
                      <label className={styles.formCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={visaForm.isActive}
                          onChange={(e) => setVisaForm({ ...visaForm, isActive: e.target.checked })}
                        />
                        Active for public inquiries
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      rows={2}
                      className={styles.formTextarea}
                      placeholder="Details and eligibility scope for this visa category..."
                      value={visaForm.description}
                      onChange={(e) => setVisaForm({ ...visaForm, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Industry Form */}
              {activeTab === 'industries' && (
                <>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Industry Sector Name *</label>
                      <input
                        type="text"
                        required
                        className={styles.formInput}
                        placeholder="e.g. Healthcare & Medical"
                        value={industryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIndustryForm({
                            ...industryForm,
                            name: val,
                            slug: !editingId
                              ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                              : industryForm.slug,
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
                        placeholder="e.g. healthcare-medical"
                        value={industryForm.slug}
                        onChange={(e) => setIndustryForm({ ...industryForm, slug: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Display Order</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={industryForm.displayOrder}
                        onChange={(e) => setIndustryForm({ ...industryForm, displayOrder: Number(e.target.value) })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formCheckboxLabel} style={{ paddingTop: '28px' }}>
                        <input
                          type="checkbox"
                          checked={industryForm.isActive}
                          onChange={(e) => setIndustryForm({ ...industryForm, isActive: e.target.checked })}
                        />
                        Active for employer manpower forms
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description (Optional)</label>
                    <textarea
                      rows={2}
                      className={styles.formTextarea}
                      placeholder="Scope of industry operations..."
                      value={industryForm.description}
                      onChange={(e) => setIndustryForm({ ...industryForm, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
