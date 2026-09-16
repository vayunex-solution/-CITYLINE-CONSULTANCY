import React from 'react';
import styles from './TrustStrip.module.css';

export function TrustStrip() {
  const pillars = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" />
        </svg>
      ),
      title: 'Visa Services',
      desc: 'Freelance & Visit Visa facilitation',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" />
        </svg>
      ),
      title: 'Business Setup',
      desc: 'Company formation & operational setup',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Recruitment',
      desc: 'Verified manpower deployment',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
      title: 'Job Opportunities',
      desc: 'Direct connection to UAE employers',
    },
  ];

  return (
    <section className={styles.strip} aria-label="Core Capabilities & Positioning">
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.statement}>
            <span className={styles.eyebrow}>Integrated Ecosystem</span>
            <h2 className={styles.heading}>One destination for your UAE journey.</h2>
          </div>

          <div className={styles.pillars}>
            {pillars.map((p) => (
              <div key={p.title} className={styles.pillarCard}>
                <span className={styles.pillarIcon} aria-hidden="true">{p.icon}</span>
                <span className={styles.pillarTitle}>{p.title}</span>
                <span className={styles.pillarDesc}>{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
