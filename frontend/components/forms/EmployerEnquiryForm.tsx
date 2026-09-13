'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';
import styles from './Forms.module.css';

export function EmployerEnquiryForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    category: '',
    headcount: '',
    timeframe: '',
    notes: '',
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categoryOptions = [
    ...MANPOWER_CATEGORIES.map((c) => ({ value: c.title, label: c.title })),
    { value: 'Multiple Categories', label: 'Multiple Operational Sectors' },
  ];

  const headcountOptions = [
    { value: '1-5', label: '1 – 5 Personnel' },
    { value: '6-20', label: '6 – 20 Personnel' },
    { value: '21-50', label: '21 – 50 Personnel' },
    { value: '50+', label: '50+ High Volume Deployment' },
  ];

  const timeframeOptions = [
    { value: 'immediate', label: 'Immediate (Within 15 days)' },
    { value: '30-days', label: 'Within 30 days' },
    { value: '60-days', label: 'Within 60 days' },
    { value: 'ongoing', label: 'Ongoing / Long-Term Staffing Contract' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) errs.companyName = 'Company name is required';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Contact person name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'A valid corporate email is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.category) errs.category = 'Please select a manpower category';
    if (!formData.headcount) errs.headcount = 'Please specify required headcount volume';
    if (!formData.consent) errs.consent = 'You must consent to recruitment advisory contact';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch {
      setErrorMessage('Submission failed. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Employer Manpower Requirement Received"
        message="Thank you for submitting your manpower requisition. A recruitment relationship manager from Cityline Consultancy will contact your organization to discuss mobilization specs and candidate trade testing."
        onReset={() => {
          setSubmitted(false);
          setFormData({
            companyName: '',
            contactPerson: '',
            designation: '',
            email: '',
            phone: '',
            category: '',
            headcount: '',
            timeframe: '',
            notes: '',
            consent: false,
          });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMessage && <FormError message={errorMessage} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-companyName"
          label="Company / Establishment Name"
          placeholder="e.g. Al Wasl Contracting LLC"
          required
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          error={errors.companyName}
        />

        <FormField
          id="emp-contactPerson"
          label="Contact Person Name"
          placeholder="e.g. Tariq Al Mansoori"
          required
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          error={errors.contactPerson}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-designation"
          label="Designation / Role"
          placeholder="e.g. HR Director / Operations Manager"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
        />

        <FormField
          id="emp-email"
          type="email"
          label="Corporate Email Address"
          placeholder="e.g. hr@alwasl.ae"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-phone"
          type="tel"
          label="Phone / Mobile Number"
          placeholder="e.g. +971 4 000 0000"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
        />

        <SelectField
          id="emp-category"
          label="Primary Manpower Category"
          options={categoryOptions}
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          error={errors.category}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <SelectField
          id="emp-headcount"
          label="Headcount Required"
          options={headcountOptions}
          required
          value={formData.headcount}
          onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
          error={errors.headcount}
        />

        <SelectField
          id="emp-timeframe"
          label="Target Deployment Timeframe"
          options={timeframeOptions}
          value={formData.timeframe}
          onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
        />
      </div>

      <TextareaField
        id="emp-notes"
        label="Specific Trade Skills or Job Site Notes"
        placeholder="Detail specific trade certifications, site location, shift requirements, or accommodation provisions..."
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className={styles.group}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
          />
          <span>
            I confirm authority to submit this manpower requisition and authorize Cityline Consultancy to initiate advisory contact regarding candidate mobilization.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Transmitting Requisition...' : 'Submit Manpower Requirement'}
      </Button>
    </form>
  );
}
