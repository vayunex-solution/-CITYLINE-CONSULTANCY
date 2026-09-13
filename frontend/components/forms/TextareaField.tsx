import React from 'react';
import styles from './Forms.module.css';

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function TextareaField({
  id,
  label,
  error,
  helpText,
  required = false,
  className = '',
  rows = 4,
  ...props
}: TextareaFieldProps) {
  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {required && <span className={styles.requiredMark} aria-hidden="true">*</span>}
      </label>
      <textarea
        id={id}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        className={`${styles.textarea} ${error ? styles.inputError : ''} ${className}`.trim()}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {!error && helpText && (
        <span id={`${id}-help`} className={styles.helpText}>
          {helpText}
        </span>
      )}
    </div>
  );
}
