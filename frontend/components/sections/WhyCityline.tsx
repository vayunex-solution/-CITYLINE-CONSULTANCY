import React from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import styles from './WhyCityline.module.css';

export function WhyCityline() {
  const benefits = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      title: 'One Comprehensive Platform',
      desc: 'Seamless coordination uniting independent visas, business formation, and operational manpower recruitment under one trusted advisory umbrella.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      ),
      title: 'Procedural Clarity',
      desc: 'Step-by-step regulatory guidance without ambiguous claims, ensuring candidates and founders understand exact documentation criteria before applying.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      title: 'Ethical & Transparent Standards',
      desc: 'No fabricated claims or false guarantees. Every consultation prioritizes compliance with UAE Ministry and Immigration directives.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      ),
      title: 'Journey-Focused Support',
      desc: 'Continuous advisory from document attestation in India through flight mobilization and in-country residency formalities in the UAE.',
    },
  ];

  return (
    <section className={`section ${styles.wrapper}`} id="why-cityline">
      <div className="container">
        <SectionHeading
          eyebrow="The Cityline Advantage"
          title={
            <>
              Grounded in integrity. <span className="text-gradient-gold">Focused on outcomes.</span>
            </>
          }
          description="We replace confusion with structured procedural advisory, bridging career aspirations and commercial initiatives between India and the UAE."
          align="center"
        />

        <div className={styles.grid}>
          {benefits.map((b) => (
            <div key={b.title} className={styles.benefitCard}>
              <span className={styles.icon} aria-hidden="true">{b.icon}</span>
              <h3 className={styles.title}>{b.title}</h3>
              <p className={styles.desc}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
