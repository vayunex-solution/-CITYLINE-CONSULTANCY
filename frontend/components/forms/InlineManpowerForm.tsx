'use client';

import React, { useState } from 'react';
import styles from './InlineManpowerForm.module.css';

const INDUSTRY_OPTIONS = [
  'Hospitality & Tourism',
  'Construction & Contracting',
  'Facility Management & Cleaning',
  'Logistics & Courier Delivery',
  'Transportation & Fleet',
  'Retail & Supermarkets',
  'Security Services',
  'Other Corporate',
];

const CANONICAL_ROLES = [
  { slug: 'hotel-staff', title: 'Hotel Staff' },
  { slug: 'cleaning', title: 'Commercial Facility Cleaner' },
  { slug: 'mason', title: 'Civil Mason' },
  { slug: 'steel-fixer', title: 'Steel Fixer' },
  { slug: 'carpenter', title: 'Shuttering Carpenter' },
  { slug: 'bike-rider-delivery', title: 'Delivery Bike Rider' },
  { slug: 'taxi-driver', title: 'Fleet Taxi Driver' },
  { slug: 'truck-driver', title: 'Heavy Commercial Driver' },
];

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

export function InlineManpowerForm() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]);
  const [roleSlug, setRoleSlug] = useState(CANONICAL_ROLES[0].slug);
  const [headcount, setHeadcount] = useState(5);
  const [city, setCity] = useState('Dubai');
  const [specialReqs, setSpecialReqs] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const selectedRole = CANONICAL_ROLES.find((r) => r.slug === roleSlug) || CANONICAL_ROLES[0];

    const payload = {
      companyName: companyName.trim(),
      contactPerson: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: phone.trim(),
      city: city.trim(),
      industry: industry.trim(),
      deploymentLocation: `${city}, UAE`,
      specialRequirements: specialReqs.trim() || undefined,
      positions: [
        {
          categorySlug: selectedRole.slug,
          roleTitle: selectedRole.title,
          headcount: Number(headcount) || 1,
        },
      ],
    };

    try {
      const res = await fetch('/api/v1/manpower-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to submit requisition.');
      }

      setSubmittedReference(data.data?.referenceNumber || data.data?.reference || 'CONFIRMED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReference(null);
    setFullName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setSpecialReqs('');
    setErrorMessage('');
  };

  if (submittedReference) {
    return (
      <div className={styles.formCard}>
        <div className={styles.successBox}>
          <div className={styles.successCheck}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className={styles.successTitle}>Requisition Dispatched</h3>
          <p className={styles.successDesc}>
            Your corporate manpower request has been logged in our deployment database.
          </p>
          <div>
            <span className={styles.refCode}>Reference: {submittedReference}</span>
          </div>
          <p className={styles.successDesc} style={{ marginTop: '8px' }}>
            Our UAE recruitment lead will contact you via WhatsApp or email within 24 business hours.
          </p>
          <button type="button" onClick={handleReset} className={styles.resetBtn}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>Request Manpower Deployment</h3>
        <p className={styles.formSubtitle}>
          Direct connection to screened trade candidates from India to UAE.
        </p>
      </div>

      {errorMessage && (
        <div className={styles.errorAlert}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="e.g. Tariq Mansoor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Company Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="e.g. Apex Facilities LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>WhatsApp / Phone *</label>
            <input
              type="tel"
              required
              className={styles.input}
              placeholder="+971 50 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Corporate Email *</label>
            <input
              type="email"
              required
              className={styles.input}
              placeholder="name@company.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Industry *</label>
            <select
              className={styles.select}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Position / Trade *</label>
            <select
              className={styles.select}
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value)}
            >
              {CANONICAL_ROLES.map((r) => (
                <option key={r.slug} value={r.slug}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Number of Workers *</label>
            <input
              type="number"
              min={1}
              max={500}
              required
              className={styles.input}
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Job Location in UAE *</label>
            <select
              className={styles.select}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {EMIRATES.map((em) => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldFull}>
          <div className={styles.field}>
            <label className={styles.label}>Additional Requirements</label>
            <textarea
              className={styles.textarea}
              placeholder="Accommodation, trade certificate, language preference..."
              value={specialReqs}
              onChange={(e) => setSpecialReqs(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <span>Request Manpower</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
