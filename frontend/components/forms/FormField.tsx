import React from 'react';
import styles from './Forms.module.css';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormField({
  id,
  label,
  error,
  helpText,
  required = false,
  className = '',
  ...props
}: FormFieldProps) {
  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {required && <span className={styles.requiredMark} aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        className={`${styles.input} ${error ? styles.inputError : ''} ${className}`.trim()}
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
