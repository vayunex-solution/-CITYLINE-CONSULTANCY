import React from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import styles from './WhyCityline.module.css';

export function WhyCityline() {
  const benefits = [
    {
      icon: '🌐',
      title: 'One Comprehensive Platform',
      desc: 'Seamless coordination uniting independent visas, business formation, and operational manpower recruitment under one trusted advisory umbrella.',
    },
    {
      icon: '📋',
      title: 'Procedural Clarity',
      desc: 'Step-by-step regulatory guidance without ambiguous claims, ensuring candidates and founders understand exact documentation criteria before applying.',
    },
    {
      icon: '🛡️',
      title: 'Ethical & Transparent Standards',
      desc: 'No fabricated claims or false guarantees. Every consultation prioritizes compliance with UAE Ministry and Immigration directives.',
    },
    {
      icon: '🚀',
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
