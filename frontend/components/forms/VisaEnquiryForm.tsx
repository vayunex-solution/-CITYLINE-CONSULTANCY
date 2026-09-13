'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import styles from './Forms.module.css';

interface VisaEnquiryFormProps {
  defaultVisaType?: string;
}

export function VisaEnquiryForm({ defaultVisaType = '' }: VisaEnquiryFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    visaType: defaultVisaType,
    nationality: '',
    timeline: '',
    details: '',
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const visaOptions = [
    { value: 'freelance-visa', label: '2-Year Freelance Visa Dubai Assistance' },
    { value: 'visit-visa-30', label: '30-Day Visit Visa Assistance' },
    { value: 'visit-visa-60', label: '60-Day Visit Visa Assistance' },
  ];

  const timelineOptions = [
    { value: 'immediate', label: 'Immediate (Within 2 weeks)' },
    { value: '1-month', label: 'Within 1 month' },
    { value: '1-3-months', label: '1 to 3 months' },
    { value: 'exploring', label: 'Planning / Exploring options' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full legal name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'A valid email address is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.visaType) errs.visaType = 'Please select a visa category';
    if (!formData.nationality.trim()) errs.nationality = 'Please specify your nationality';
    if (!formData.consent) errs.consent = 'You must consent to being contacted regarding this enquiry';
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
      setErrorMessage('Submission failed. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Visa Consultation Enquiry Submitted"
        message="Your visa enquiry has been registered with Cityline Consultancy. A visa specialist will review your profile requirements and contact you with structured guidance."
        onReset={() => {
          setSubmitted(false);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            visaType: defaultVisaType,
            nationality: '',
            timeline: '',
            details: '',
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
          id="visa-fullName"
          label="Full Name (as on Passport)"
          placeholder="e.g. Amit Patel"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
        />

        <FormField
          id="visa-email"
          type="email"
          label="Email Address"
          placeholder="e.g. amit@example.com"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="visa-phone"
          type="tel"
          label="Phone / WhatsApp Number"
          placeholder="e.g. +91 98765 43210"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          helpText="Include country calling code"
        />

        <FormField
          id="visa-nationality"
          label="Nationality / Country of Passport"
          placeholder="e.g. Indian"
          required
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          error={errors.nationality}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <SelectField
          id="visa-type"
          label="Visa Category of Interest"
          options={visaOptions}
          required
          value={formData.visaType}
          onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
          error={errors.visaType}
        />

        <SelectField
          id="visa-timeline"
          label="Target Relocation / Travel Timeline"
          options={timelineOptions}
          value={formData.timeline}
          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
        />
      </div>

      <TextareaField
        id="visa-details"
        label="Background & Specific Queries (Optional)"
        placeholder="Share your current profession, intended activities in the UAE, or questions..."
        value={formData.details}
        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
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
            I consent to Cityline Consultancy evaluating my travel/visa enquiry and contacting me regarding applicable procedural guidance.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting Visa Enquiry...' : 'Submit Visa Enquiry'}
      </Button>
    </form>
  );
}
