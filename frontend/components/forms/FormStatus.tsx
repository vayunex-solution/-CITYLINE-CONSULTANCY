import React from 'react';
import styles from './Forms.module.css';

interface FormSuccessProps {
  title?: string;
  message: string;
  onReset?: () => void;
}

export function FormSuccess({
  title = 'Enquiry Received Successfully',
  message,
  onReset,
}: FormSuccessProps) {
  return (
    <div className={styles.successBox} role="status">
      <span style={{ fontSize: '2rem' }} aria-hidden="true">✓</span>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--status-success)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '480px' }}>
        {message}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: 'var(--space-2)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--surface-elevated)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Submit Another Enquiry
        </button>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className={styles.errorBox} role="alert">
      <strong>Error:</strong> {message}
    </div>
  );
}
