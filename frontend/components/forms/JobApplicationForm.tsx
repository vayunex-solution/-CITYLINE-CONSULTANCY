'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import { JobOpportunity } from '@/lib/types/website.types';
import styles from './Forms.module.css';

interface JobApplicationFormProps {
  job: JobOpportunity;
}

export function JobApplicationForm({ job }: JobApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentLocation: '',
    experienceYears: '',
    summary: '',
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const expOptions = [
    { value: '0-1', label: 'Less than 1 year / Trainee' },
    { value: '1-3', label: '1 to 3 years' },
    { value: '3-5', label: '3 to 5 years' },
    { value: '5+', label: '5+ years seasoned experience' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'A valid email address is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.currentLocation.trim()) errs.currentLocation = 'Please specify current city/country';
    if (!formData.experienceYears) errs.experienceYears = 'Please indicate total relevant experience';
    if (!formData.consent) errs.consent = 'You must consent to recruitment data processing';
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
      setErrorMessage('Application transmission failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Application Registration Received"
        message={`Your application for "${job.title}" has been registered with Cityline Consultancy. Our recruitment coordination team will review your trade credentials and connect with you for pre-screening.`}
        onReset={() => {
          setSubmitted(false);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            currentLocation: '',
            experienceYears: '',
            summary: '',
            consent: false,
          });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMessage && <FormError message={errorMessage} />}

      <div
        className="glass-panel"
        style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>Applying for: <strong>{job.title}</strong></span>
        <span>Location: <strong>{job.location}</strong></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="app-fullName"
          label="Full Name (as on Passport)"
          placeholder="e.g. Vikram Singh"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
        />

        <FormField
          id="app-email"
          type="email"
          label="Email Address"
          placeholder="e.g. vikram@example.com"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="app-phone"
          type="tel"
          label="Phone / WhatsApp"
          placeholder="e.g. +91 98765 43210"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
        />

        <FormField
          id="app-currentLocation"
          label="Current City & Country"
          placeholder="e.g. Mumbai, India"
          required
          value={formData.currentLocation}
          onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
          error={errors.currentLocation}
        />
      </div>

      <SelectField
        id="app-exp"
        label="Total Practical Trade Experience"
        options={expOptions}
        required
        value={formData.experienceYears}
        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
        error={errors.experienceYears}
      />

      <TextareaField
        id="app-summary"
        label="Summary of Trade Skills & Prior Employers"
        placeholder="Briefly describe your practical trade background, equipment operated, or relevant projects..."
        value={formData.summary}
        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
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
            I certify that the information supplied is accurate and consent to Cityline Consultancy processing my profile for UAE employment consideration.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Registering Application...' : 'Submit Application'}
      </Button>
    </form>
  );
}
