'use client';

import React, { useState, useRef } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import styles from './Forms.module.css';

const MAX_FILES_COUNT = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];

export function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    consent: false,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reference, setReference] = useState('');
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);

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
      const payload = new FormData();
      payload.append('fullName', formData.fullName.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('phone', formData.phone.trim());
      payload.append('service', formData.service);
      payload.append('message', formData.message.trim());
      payload.append('consent', 'true');

      for (const file of files) {
        payload.append('documents', file);
      }

      const res = await fetch('/api/v1/business-enquiries', {
        method: 'POST',
        body: payload,
      });

      const resData = await res.json();

      if (!res.ok) {
        const fieldErrs = resData.error?.details?.fieldErrors || resData.error?.fieldErrors;
        if (fieldErrs) {
          setErrors(fieldErrs);
          setErrorMessage('Please correct the highlighted errors in the form.');
        } else if (res.status === 413) {
          setErrorMessage('The uploaded files exceed the maximum allowed size limit (25MB total).');
        } else if (res.status === 429) {
          setErrorMessage('Too many submissions received. Please wait a moment before trying again.');
        } else {
          setErrorMessage(resData.error?.message || resData.message || 'Submission failed. Please try again.');
        }
        return;
      }

      setReference(resData.data?.reference || '');
      setUploadedDocsCount(resData.data?.documentsCount || files.length);
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
            ? `Thank you for contacting Cityline Consultancy. Your consultation enquiry has been registered under Reference ID: ${reference}.${
                uploadedDocsCount > 0
                  ? ` We have securely received and encrypted ${uploadedDocsCount} supporting document${
                      uploadedDocsCount > 1 ? 's' : ''
                    }.`
                  : ''
              } An advisory specialist will review your requirements and coordinate an official response shortly.`
            : 'Thank you for contacting Cityline Consultancy. An advisory representative will review your enquiry and get in touch shortly.'
        }
        onReset={() => {
          setSubmitted(false);
          setReference('');
          setUploadedDocsCount(0);
          setFiles([]);
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

      {/* Supporting Document Upload Dropzone */}
      <div className={styles.group}>
        <label className={styles.label}>
          Supporting Documents (Optional)
        </label>
        <span className={styles.helpText}>
          Attach trade license, passport copy, resume, or business deck. Formats: PDF, JPG, PNG, DOCX (Max 10MB per file, up to 5 files).
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
                    ✕
                  </button>
                </li>
              ))}
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
            I agree to receive advisory communication and consultation updates from Cityline Consultancy in connection with this enquiry.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Transmitting Enquiry & Documents...' : 'Submit Consultation Request'}
      </Button>
    </form>
  );
}
