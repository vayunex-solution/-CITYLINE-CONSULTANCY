'use client';

import React, { useState, useRef } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import { JobOpportunity } from '@/lib/types/website.types';
import { submitJobApplication } from '@/lib/jobs-api';
import styles from './Forms.module.css';

interface JobApplicationFormProps {
  job: JobOpportunity;
}

const ALLOWED_EXTENSIONS = ['pdf', 'docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function JobApplicationForm({ job }: JobApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    nationality: 'Indian',
    currentLocation: '',
    experienceYears: '2',
    qualification: '',
    coverLetter: '',
    consent: false,
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  const expOptions = [
    { value: '0', label: 'Fresh Trainee / Less than 1 year' },
    { value: '1', label: '1 year practical experience' },
    { value: '2', label: '2 years practical experience' },
    { value: '3', label: '3 years practical experience' },
    { value: '5', label: '5+ years seasoned experience' },
    { value: '8', label: '8+ years senior craftsman / operator' },
  ];

  const handleFileChange = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    setFileError('');
    const file = incomingFiles[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`File "${file.name}" is unsupported. Only PDF and DOCX files are accepted.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File "${file.name}" exceeds the 10MB limit.`);
      return;
    }

    setCvFile(file);
  };

  const handleRemoveFile = () => {
    setCvFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'A valid email address is required';
    }
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.currentLocation.trim()) errs.currentLocation = 'Please specify your current city & country';
    if (!formData.experienceYears) errs.experienceYears = 'Please indicate total relevant trade experience';
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
      const payload = new FormData();
      payload.append('fullName', formData.fullName.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('phone', formData.phone.trim());
      if (formData.whatsapp.trim()) payload.append('whatsapp', formData.whatsapp.trim());
      if (formData.nationality.trim()) payload.append('nationality', formData.nationality.trim());
      payload.append('currentLocation', formData.currentLocation.trim());
      payload.append('yearsExperience', formData.experienceYears);
      if (formData.qualification.trim()) payload.append('qualification', formData.qualification.trim());
      if (formData.coverLetter.trim()) payload.append('coverLetter', formData.coverLetter.trim());
      payload.append('consent', 'true');

      if (cvFile) {
        payload.append('cv', cvFile);
      }

      // Generate client-side idempotency key for safe duplicate-click retries
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await submitJobApplication(job.slug, payload, idempotencyKey);

      setReferenceNumber(res.reference);
      setSubmitted(true);
    } catch (err: any) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        setErrorMessage('Please correct the highlighted errors in your application.');
      } else {
        setErrorMessage(err.message || 'Application transmission failed. Please retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Application Registration Received"
        message={
          referenceNumber
            ? `Your application for "${job.title}" has been registered under Reference ID: ${referenceNumber}. Our recruitment coordination team will review your trade credentials and connect with you for pre-screening.`
            : `Your application for "${job.title}" has been registered with Cityline Consultancy. Our recruitment coordination team will review your trade credentials and connect with you for pre-screening.`
        }
        onReset={() => {
          setSubmitted(false);
          setReferenceNumber('');
          setCvFile(null);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            whatsapp: '',
            nationality: 'Indian',
            currentLocation: '',
            experienceYears: '2',
            qualification: '',
            coverLetter: '',
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
        <span>Trade Category: <strong>{job.category}</strong></span>
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
          label="Mobile Phone Number"
          placeholder="e.g. +91 98765 43210"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
        />

        <FormField
          id="app-whatsapp"
          type="tel"
          label="WhatsApp Number (Optional)"
          placeholder="e.g. +91 98765 43210"
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          error={errors.whatsapp}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="app-currentLocation"
          label="Current City & Country"
          placeholder="e.g. Mumbai, India"
          required
          value={formData.currentLocation}
          onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
          error={errors.currentLocation}
        />

        <FormField
          id="app-nationality"
          label="Nationality"
          placeholder="e.g. Indian"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          error={errors.nationality}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <SelectField
          id="app-exp"
          label="Practical Trade Experience"
          options={expOptions}
          required
          value={formData.experienceYears}
          onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
          error={errors.experienceYears}
        />

        <FormField
          id="app-qualification"
          label="Education / Certification (Optional)"
          placeholder="e.g. ITI Diploma, High School"
          value={formData.qualification}
          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
        />
      </div>

      <TextareaField
        id="app-summary"
        label="Summary of Trade Skills & Prior Projects (Optional)"
        placeholder="Briefly describe your practical trade background, equipment operated, or relevant projects..."
        value={formData.coverLetter}
        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
      />

      {/* CV / Resume Upload Dropzone */}
      <div className={styles.group}>
        <label className={styles.label}>
          Curriculum Vitae / Resume (Optional)
        </label>
        <span className={styles.helpText}>
          Upload your CV for structured review. Formats: PDF or DOCX (Max 10MB).
        </span>

        <div
          className={`${styles.uploadDropzone} ${isDragOver ? styles.uploadDropzoneActive : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileChange(e.dataTransfer.files);
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload CV or Resume"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={styles.fileInputHidden}
            onChange={(e) => handleFileChange(e.target.files)}
          />
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📄</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Drag and drop your CV here, or <span style={{ color: 'var(--accent-gold-primary)' }}>browse files</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            PDF or DOCX format, up to 10MB
          </div>
        </div>

        {fileError && <span className={styles.errorText} role="alert">{fileError}</span>}

        {cvFile && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <ul className={styles.fileList}>
              <li className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <span>📎</span>
                  <span className={styles.fileName}>{cvFile.name}</span>
                  <span className={styles.fileSize}>
                    ({(cvFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.fileRemoveBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  aria-label={`Remove ${cvFile.name}`}
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className={styles.group}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
          />
          <span>
            I certify that the information supplied is accurate and consent to Cityline Consultancy processing my trade profile for lawful UAE employment consideration.
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
