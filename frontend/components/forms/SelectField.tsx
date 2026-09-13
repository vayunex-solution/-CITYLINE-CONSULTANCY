import React from 'react';
import styles from './Forms.module.css';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Option[];
  placeholder?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function SelectField({
  id,
  label,
  options,
  placeholder = 'Please select...',
  error,
  helpText,
  required = false,
  className = '',
  ...props
}: SelectFieldProps) {
  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        <span>{label}</span>
        {required && <span className={styles.requiredMark} aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        className={`${styles.select} ${error ? styles.inputError : ''} ${className}`.trim()}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
