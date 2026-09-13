import React from 'react';
import styles from './JourneyIndicator.module.css';

export function JourneyIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.indicator} ${className}`.trim()} aria-label="India to UAE Career Journey Process">
      <span className={styles.step}>INDIA</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <span className={styles.step}>JOURNEY</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <span className={`${styles.step} ${styles.activeStep}`}>UAE</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
      <span className={`${styles.step} ${styles.activeStep}`}>OPPORTUNITY</span>
    </div>
  );
}
