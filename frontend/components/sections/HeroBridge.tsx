import React from 'react';
import styles from './HeroBridge.module.css';

const STATS = [
  { value: '10K+', label: 'Happy Clients' },
  { value: '50+', label: 'Services Covered' },
  { value: '500+', label: 'Placements & Employees' },
  { value: '100%', label: 'Commitment' },
  { value: '24/7', label: 'Customer Support' },
];

export function HeroBridge() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bridgeBar}>
        <div className={styles.origin}>
          <div className={styles.flagRoundel} aria-label="India flag badge">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#F4F4F4" />
              <path d="M0 18C0 8.05887 8.05887 0 18 0C27.9411 0 36 8.05887 36 18H0Z" fill="#FF9933" />
              <path d="M0 18C0 27.9411 8.05887 36 18 36C27.9411 36 36 27.9411 36 18H0Z" fill="#138808" />
              <rect y="12" width="36" height="12" fill="#FFFFFF" />
              <circle cx="18" cy="18" r="4.5" stroke="#000080" strokeWidth="1.2" fill="none" />
              <circle cx="18" cy="18" r="1.5" fill="#000080" />
            </svg>
          </div>
          <div>
            <div className={styles.countryName}>INDIA</div>
            <div className={styles.countryTag}>Skills &amp; Aspirations</div>
          </div>
        </div>

        <div className={styles.connector}>
          <div className={styles.connectorLine} />
          <div className={styles.connectorCenter}>
            <div className={styles.connectorLogo}>CITYLINE</div>
            <div className={styles.connectorTag}>CONSULTANCY FZE</div>
            <div className={styles.connectorSub}>WE CONNECT THE JOURNEY</div>
          </div>
          <div className={styles.connectorLine} />
        </div>

        <div className={styles.destination}>
          <div>
            <div className={styles.countryName}>UAE</div>
            <div className={styles.countryTag}>Opportunities &amp; Growth</div>
          </div>
          <div className={styles.flagRoundel} aria-label="UAE flag badge">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <clipPath id="uae-circle"><circle cx="18" cy="18" r="18" /></clipPath>
              <g clipPath="url(#uae-circle)">
                <rect width="36" height="12" fill="#00732F" />
                <rect y="12" width="36" height="12" fill="#FFFFFF" />
                <rect y="24" width="36" height="12" fill="#000000" />
                <rect width="11" height="36" fill="#FF0000" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
