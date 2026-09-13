import React from 'react';
import styles from './TrustStrip.module.css';

export function TrustStrip() {
  const pillars = [
    {
      icon: '🏛️',
      title: 'Visa Services',
      desc: 'Freelance & Visit Visa facilitation',
    },
    {
      icon: '🏢',
      title: 'Business Setup',
      desc: 'Company formation & operational setup',
    },
    {
      icon: '🤝',
      title: 'Recruitment',
      desc: 'Verified manpower deployment',
    },
    {
      icon: '💼',
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
