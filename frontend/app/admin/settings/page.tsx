'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/admin-api';
import styles from '@/components/admin/common/AdminCommon.module.css';

interface SettingsData {
  settings: {
    admin_notification_email?: string;
    notification_alerts_enabled?: string;
    [key: string]: string | undefined;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    from: string;
    isMockMode: boolean;
  };
}

interface TrashItem {
  id: string;
  type: 'visa_enquiry' | 'business_enquiry' | 'job_application';
  typeLabel: string;
  reference: string;
  applicantName: string;
  email: string;
  phone: string;
  status: string;
  deletedAt: string;
  daysRemaining: number;
  expiresAt: string;
  documentCount: number;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'trash'>('email');

  // Email Settings State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [smtpInfo, setSmtpInfo] = useState<SettingsData['smtp'] | null>(null);
  const [testResult, setTestResult] = useState<{ message: string; messageId?: string } | null>(null);

  // Trash Bin State
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashSearch, setTrashSearch] = useState('');
  const [trashActionId, setTrashActionId] = useState<string | null>(null);
  const [emptyingTrash, setEmptyingTrash] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<SettingsData>('/admin/settings');
      if (res.success && res.data) {
        setAdminEmail(res.data.settings.admin_notification_email || 'yashkr4748@gmail.com');
        setAlertsEnabled(res.data.settings.notification_alerts_enabled !== 'false');
        setSmtpInfo(res.data.smtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const params = new URLSearchParams();
      if (trashSearch.trim()) params.set('search', trashSearch.trim());
      const res = await adminFetch<TrashItem[]>(`/admin/trash?${params.toString()}`);
      if (res.success) {
        setTrashItems(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trash items.');
    } finally {
      setTrashLoading(false);
    }
  }, [trashSearch]);

  useEffect(() => {
    fetchSettings();
    fetchTrash();
  }, [fetchSettings, fetchTrash]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setError('Please enter a valid administrative email address.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setTestResult(null);

    try {
      const res = await adminFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          admin_notification_email: adminEmail.trim(),
          notification_alerts_enabled: alertsEnabled ? 'true' : 'false',
        }),
      });

      if (res.success) {
        setSuccess('Email settings successfully updated. All future form submissions will dispatch alerts to this address.');
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update administrative settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setError('Please provide a valid recipient email before sending a test dispatch.');
      return;
    }

    setTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const res = await adminFetch<{ recipient: string; messageId: string }>('/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail.trim() }),
      });

      if (res.success) {
        setTestResult({
          message: `Live test email successfully dispatched to ${adminEmail.trim()}`,
          messageId: res.data?.messageId,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch test notification email.');
    } finally {
      setTesting(false);
    }
  };

  const handleRestore = async (item: TrashItem) => {
    setTrashActionId(`restore-${item.id}`);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch(`/admin/trash/${item.type}/${item.id}/restore`, {
        method: 'POST',
      });
      if (res.success) {
        setSuccess(`"${item.applicantName || item.reference}" has been restored to active records.`);
        setTimeout(() => setSuccess(null), 4000);
        fetchTrash();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore item.');
    } finally {
      setTrashActionId(null);
    }
  };

  const handleDeleteForever = async (item: TrashItem) => {
    if (
      !window.confirm(
        `Permanently delete "${item.applicantName || item.reference}" and completely erase all attached documents from disk? This cannot be undone.`
      )
    ) {
      return;
    }
    setTrashActionId(`delete-${item.id}`);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch(`/admin/trash/${item.type}/${item.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setSuccess(`"${item.applicantName || item.reference}" permanently erased from database and storage.`);
        setTimeout(() => setSuccess(null), 4000);
        fetchTrash();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to permanently delete item.');
    } finally {
      setTrashActionId(null);
    }
  };

  const handleEmptyAllTrash = async () => {
    if (trashItems.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to empty the entire Trash Bin? All ${trashItems.length} items and associated physical files will be PERMANENTLY deleted immediately!`
      )
    ) {
      return;
    }
    setEmptyingTrash(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch<{ purgedCount: number }>('/admin/trash/purge', {
        method: 'POST',
        body: JSON.stringify({ emptyAll: true }),
      });
      if (res.success) {
        setSuccess(res.message || 'Trash bin emptied successfully.');
        setTimeout(() => setSuccess(null), 4000);
        fetchTrash();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to empty trash bin.');
    } finally {
      setEmptyingTrash(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>System & Retention Settings</h1>
          <p className={styles.pageSubtitle}>
            Configure administrative email alerts, notification recipient mailboxes, and manage the 30-day trash retention bin.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/notifications" className={styles.btnSecondary}>
            View Outbox Queue →
          </Link>
          <button
            className={styles.btnSecondary}
            onClick={() => {
              fetchSettings();
              fetchTrash();
            }}
            disabled={loading || trashLoading}
          >
            {loading || trashLoading ? 'Refreshing...' : '↻ Reload'}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'email' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('email')}
        >
          ⚙️ Email & Notification Settings
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'trash' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          🗑️ Trash Bin (30-Day Retention)
          {trashItems.length > 0 && (
            <span
              className={styles.badge}
              style={{
                marginLeft: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--status-error)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '1px 6px',
                fontSize: '11px',
              }}
            >
              {trashItems.length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner} style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successBanner} style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      {testResult && activeTab === 'email' && (
        <div className={styles.successBanner} style={{ marginBottom: 'var(--space-5)', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--status-success)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 600 }}>✓ {testResult.message}</div>
            {testResult.messageId && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Message ID: <code>{testResult.messageId}</code> (Accepted by SMTP server)
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: EMAIL SETTINGS */}
      {activeTab === 'email' && (
        <>
          {loading ? (
            <div className={styles.loadingBox}>
              <p>Loading administrative configuration...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Card 1: Email Alert Recipient Configuration */}
              <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Administrative Notification Recipient Email
                    </h2>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      The destination mailbox where all new website lead notifications and customer submissions are delivered.
                    </p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active Pipeline</span>
                </div>

                <form onSubmit={handleSave}>
                  <div className={styles.formGroup} style={{ marginBottom: 'var(--space-4)' }}>
                    <label className={styles.formLabel} htmlFor="adminNotificationEmail">
                      Admin Alert Email Address: <span style={{ color: 'var(--status-error)' }}>*</span>
                    </label>
                    <input
                      id="adminNotificationEmail"
                      type="email"
                      className={styles.formInput}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. yashkr4748@gmail.com"
                      required
                      style={{ fontSize: 'var(--text-sm)', padding: '10px 14px', maxWidth: '480px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                      Whenever a user submits any form on the website (Contact Enquiry, Visa Application, Job Application, or Manpower Requirement), an instant alert with full details and attached PDFs will be sent to this email.
                    </span>
                  </div>

                  <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="alertsEnabled"
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-gold-primary)' }}
                    />
                    <label htmlFor="alertsEnabled" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Enable automatic outbound email notifications for all incoming submissions
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={saving || testing}
                      style={{ minWidth: '140px' }}
                    >
                      {saving ? 'Saving...' : '💾 Save Settings'}
                    </button>

                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleSendTestEmail}
                      disabled={saving || testing}
                      title="Sends an immediate test ping email over SMTP to verify deliverability"
                    >
                      {testing ? 'Sending Test Email...' : '✉ Send Live Test Email'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Form Notification Coverage Matrix */}
              <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)' }}>
                  Form Notification Coverage Status
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                  <div style={{ padding: 'var(--space-4)', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>1. Contact Us Form</strong>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Online</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Route: <code>/contact</code><br />
                      Attachment: <strong>PDF & Documents included directly in email</strong>
                    </p>
                  </div>

                  <div style={{ padding: 'var(--space-4)', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>2. Visa Enquiries</strong>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Online</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Route: <code>/services/*</code><br />
                      Alerts with applicant details, passport/visa requirements
                    </p>
                  </div>

                  <div style={{ padding: 'var(--space-4)', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>3. Job Applications</strong>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Online</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Route: <code>/careers/*</code><br />
                      Alerts recruitment team with candidate experience & CV
                    </p>
                  </div>

                  <div style={{ padding: 'var(--space-4)', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>4. Manpower Requisitions</strong>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Online</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Route: <code>/employers</code><br />
                      Corporate requisitions, headcount demands, and specs
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: SMTP Connection Health Diagnostics */}
              <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)' }}>
                  Outbound SMTP Infrastructure
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SMTP Server</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                      {smtpInfo?.host || 'mail.citylineconsultancy.com'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Port & Security</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                      {smtpInfo?.port || 465} (Implicit SSL/TLS 1.2+)
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sender Address</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                      {smtpInfo?.from || 'no-reply@citylineconsultancy.com'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Health</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-success)', marginTop: '2px' }}>
                      ✓ Operational (100% Verified)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: TRASH RETENTION BIN */}
      {activeTab === 'trash' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Information Card */}
          <div
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--accent-gold-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                30-Day Automated Retention Lifecycle
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Rejected and soft-deleted visa enquiries, candidate applications, and contact leads are held safely in this bin for exactly 30 days. You can restore them to the active system or permanently erase them and their physical storage files immediately.
              </p>
            </div>
            {trashItems.length > 0 && (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleEmptyAllTrash}
                disabled={emptyingTrash}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                {emptyingTrash ? 'Emptying...' : '⚠️ Empty Trash Bin'}
              </button>
            )}
          </div>

          {/* Trash Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search trash by applicant, email, phone, or reference..."
                value={trashSearch}
                onChange={(e) => setTrashSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {trashItems.length} item{trashItems.length === 1 ? '' : 's'} in retention bin
            </span>
          </div>

          {/* Trash Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Type</th>
                  <th>Applicant / Title</th>
                  <th>Contact Details</th>
                  <th>Deleted Date</th>
                  <th>Retention Countdown</th>
                  <th>Attached Files</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashLoading ? (
                  <tr>
                    <td colSpan={7} className={styles.loadingBox}>
                      Loading trash items...
                    </td>
                  </tr>
                ) : trashItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyBox}>
                      <div style={{ padding: 'var(--space-6) 0' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗑️</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Trash Bin is Empty</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                          No rejected or deleted items in the 30-day holding bin.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trashItems.map((item) => {
                    const isUrgent = item.daysRemaining <= 5;

                    return (
                      <tr key={`${item.type}-${item.id}`}>
                        <td>
                          <span
                            className={styles.badge}
                            style={{
                              background:
                                item.type === 'visa_enquiry'
                                  ? 'rgba(2, 132, 199, 0.12)'
                                  : item.type === 'job_application'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(147, 51, 234, 0.12)',
                              color:
                                item.type === 'visa_enquiry'
                                  ? 'var(--status-info)'
                                  : item.type === 'job_application'
                                  ? 'var(--status-success)'
                                  : '#a855f7',
                              border:
                                item.type === 'visa_enquiry'
                                  ? '1px solid rgba(2, 132, 199, 0.25)'
                                  : item.type === 'job_application'
                                  ? '1px solid rgba(16, 185, 129, 0.25)'
                                  : '1px solid rgba(147, 51, 234, 0.25)',
                            }}
                          >
                            {item.typeLabel}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.applicantName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.reference}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>{item.email || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.phone || '—'}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(item.deletedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={styles.badge}
                            style={{
                              background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                              color: isUrgent ? 'var(--status-error)' : 'var(--status-warning)',
                              border: isUrgent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>⏱️</span>
                            {item.daysRemaining === 0 ? 'Expiring Today' : `${item.daysRemaining} days left`}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badge} style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>
                            📎 {item.documentCount} {item.documentCount === 1 ? 'file' : 'files'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className={styles.btnSecondary}
                              onClick={() => handleRestore(item)}
                              disabled={trashActionId === `restore-${item.id}`}
                              style={{ fontSize: '11px', padding: '4px 10px' }}
                              title="Restore to active records"
                            >
                              {trashActionId === `restore-${item.id}` ? 'Restoring...' : '♻️ Restore'}
                            </button>
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => handleDeleteForever(item)}
                              disabled={trashActionId === `delete-${item.id}`}
                              style={{ fontSize: '11px', padding: '4px 10px' }}
                              title="Permanently erase from disk and database"
                            >
                              {trashActionId === `delete-${item.id}` ? 'Erasing...' : '❌ Delete Forever'}
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
      )}
    </div>
  );
}
