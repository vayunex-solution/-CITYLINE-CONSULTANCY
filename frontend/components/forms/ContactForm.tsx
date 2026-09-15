'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import styles from './Forms.module.css';

export function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [reference, setReference] = useState('');

  const serviceOptions = [
    { value: 'freelance-visa', label: '2-Year Freelance Visa Dubai' },
    { value: 'visit-visa-30', label: '30-Day Visit Visa' },
    { value: 'visit-visa-60', label: '60-Day Visit Visa' },
    { value: 'company-formation', label: 'UAE Company Formation' },
    { value: 'company-setup', label: 'Full Company Setup' },
    { value: 'recruitment-candidate', label: 'Job Opportunity Enquiry' },
    { value: 'recruitment-employer', label: 'Employer Manpower Requirement' },
    { value: 'other', label: 'General Corporate Consultation' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'A valid email address is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.service) errs.service = 'Please select a service area';
    if (!formData.message.trim()) errs.message = 'Please provide brief details regarding your enquiry';
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
      const res = await fetch('/api/v1/business-enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          service: formData.service,
          message: formData.message.trim(),
          consent: formData.consent,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        const fieldErrs = resData.error?.details?.fieldErrors || resData.error?.fieldErrors;
        if (fieldErrs) {
          setErrors(fieldErrs);
          setErrorMessage('Please correct the highlighted errors in the form.');
        } else if (res.status === 429) {
          setErrorMessage('Too many submissions received. Please wait a moment before trying again.');
        } else {
          setErrorMessage(resData.error?.message || resData.message || 'Submission failed. Please try again.');
        }
        return;
      }

      setReference(resData.data?.reference || '');
      setSubmitted(true);
    } catch {
      setErrorMessage('Unable to transmit enquiry. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Consultation Request Received"
        message={
          reference
            ? `Thank you for contacting Cityline Consultancy. Your enquiry has been registered under Reference ID: ${reference}. An advisory representative will review your requirements and get in touch shortly.`
            : 'Thank you for contacting Cityline Consultancy. An advisory representative will review your enquiry and get in touch shortly.'
        }
        onReset={() => {
          setSubmitted(false);
          setReference('');
          setFormData({ fullName: '', email: '', phone: '', service: '', message: '', consent: false });
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMessage && <FormError message={errorMessage} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="contact-fullName"
          label="Full Legal Name"
          placeholder="e.g. Rahul Sharma"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          error={errors.fullName}
        />

        <FormField
          id="contact-email"
          type="email"
          label="Email Address"
          placeholder="e.g. rahul@example.com"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="contact-phone"
          type="tel"
          label="Phone / Mobile Number"
          placeholder="e.g. +91 98765 43210"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          helpText="Include country code for prompt scheduling"
        />

        <SelectField
          id="contact-service"
          label="Primary Service Interest"
          options={serviceOptions}
          required
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          error={errors.service}
        />
      </div>

      <TextareaField
        id="contact-message"
        label="Message / Enquiry Details"
        placeholder="Briefly describe your requirements or questions..."
        required
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        error={errors.message}
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
            I agree to receive advisory communication and consultation updates from Cityline Consultancy in connection with this enquiry.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Transmitting Enquiry...' : 'Submit Consultation Request'}
      </Button>
    </form>
  );
}
