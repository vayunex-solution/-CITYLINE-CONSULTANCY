'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import styles from './Forms.module.css';

interface VisaEnquiryFormProps {
  defaultVisaType?: string;
}

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES_COUNT = 5;

export function VisaEnquiryForm({ defaultVisaType = '' }: VisaEnquiryFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    visaType: defaultVisaType || 'freelance-visa',
    nationality: '',
    timeline: '',
    details: '',
    consent: false,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [visaOptions, setVisaOptions] = useState([
    { value: 'freelance-visa', label: '2-Year Freelance Visa Dubai Assistance' },
    { value: 'visit-visa-30', label: '30-Day Visit Visa Assistance' },
    { value: 'visit-visa-60', label: '60-Day Visit Visa Assistance' },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function loadActiveServices() {
      try {
        const res = await fetch('/api/v1/visa-enquiries/services');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              setVisaOptions(
                json.data.map((s: any) => ({
                  value: s.slug || s.serviceCode,
                  label: s.title,
                }))
              );
            }
          }
        }
      } catch {
        // Safe fallback to approved options
      }
    }
    loadActiveServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const timelineOptions = [
    { value: 'immediate', label: 'Immediate (Within 2 weeks)' },
    { value: '1-month', label: 'Within 1 month' },
    { value: '1-3-months', label: '1 to 3 months' },
    { value: 'exploring', label: 'Planning / Exploring options' },
  ];

  const handleFilesAdded = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;

    setFileError('');
    const newFiles: File[] = [...files];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`File "${file.name}" has an unsupported format. Allowed: PDF, JPG, PNG, DOCX.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File "${file.name}" exceeds the 10MB individual file limit.`);
        return;
      }

      if (newFiles.length >= MAX_FILES_COUNT) {
        setFileError(`Maximum of ${MAX_FILES_COUNT} documents can be attached per enquiry.`);
        return;
      }

      // Avoid duplicates by name + size
      if (!newFiles.some((f) => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }

    setFiles(newFiles);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError('');
  };

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
      const payload = new FormData();
      payload.append('fullName', formData.fullName.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('phone', formData.phone.trim());
      payload.append('visaType', formData.visaType);
      payload.append('nationality', formData.nationality.trim());
      if (formData.timeline) payload.append('timeline', formData.timeline);
      if (formData.details) payload.append('details', formData.details.trim());
      payload.append('consent', 'true');

      for (const file of files) {
        payload.append('documents', file);
      }

      const response = await fetch('/api/v1/visa-enquiries', {
        method: 'POST',
        body: payload,
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error?.fieldErrors) {
          setErrors(responseData.error.fieldErrors);
          setErrorMessage('Please correct the highlighted errors in the form.');
        } else if (response.status === 413) {
          setErrorMessage('The uploaded files exceed the maximum allowed size limit (25MB total).');
        } else if (response.status === 429) {
          setErrorMessage('Too many submissions received. Please wait a few minutes before trying again.');
        } else {
          setErrorMessage(responseData.error?.message || responseData.message || 'Submission failed. Please try again.');
        }
        return;
      }

      setReferenceNumber(responseData.data?.reference || '');
      setSubmitted(true);
    } catch {
      setErrorMessage('Unable to connect to the enquiry service. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <FormSuccess
        title="Visa Consultation Enquiry Registered"
        message={
          referenceNumber
            ? `Your enquiry has been successfully registered under Reference: ${referenceNumber}. Our visa advisory team will evaluate your case requirements and contact you with structured procedural guidance.`
            : 'Your visa enquiry has been registered with Cityline Consultancy. A visa specialist will review your profile requirements and contact you with structured guidance.'
        }
        onReset={() => {
          setSubmitted(false);
          setReferenceNumber('');
          setFiles([]);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            visaType: defaultVisaType || 'freelance-visa',
            nationality: '',
            timeline: '',
            details: '',
            consent: false,
          });
        }}
      />
    );
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

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

      {/* Document Upload Section */}
      <div className={styles.group}>
        <label className={styles.label}>
          Supporting Documents (Optional)
        </label>
        <span className={styles.helpText}>
          Upload passport copy or resume for faster profile evaluation. Formats: PDF, JPG, PNG, DOCX (Max 10MB per file, up to 5 files).
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
            handleFilesAdded(e.dataTransfer.files);
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload supporting documents"
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
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            className={styles.fileInputHidden}
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Drag and drop documents here, or <span style={{ color: 'var(--accent-gold-primary)' }}>browse files</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            PDF, JPG, PNG, or DOCX up to 10MB each ({files.length}/5 attached)
          </div>
        </div>

        {fileError && <span className={styles.errorText} role="alert">{fileError}</span>}

        {files.length > 0 && (
          <div>
            <ul className={styles.fileList}>
              {files.map((file, idx) => (
                <li key={`${file.name}-${idx}`} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.fileRemoveBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(idx);
                    }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
              Total upload size: {totalMb} MB / 25 MB maximum
            </div>
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
