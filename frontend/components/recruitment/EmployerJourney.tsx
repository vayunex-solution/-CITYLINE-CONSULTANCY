import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export function EmployerJourney() {
  const employerSteps = [
    {
      step: '01',
      title: 'Requirement Consultation',
      desc: 'Define volume hiring specs, trade skill criteria, mobilization schedules, and deployment targets.',
    },
    {
      step: '02',
      title: 'Targeted Talent Sourcing',
      desc: 'Source vetted tradespeople, service personnel, and drivers matched to operational demands.',
    },
    {
      step: '03',
      title: 'Trade Testing & Document Vetting',
      desc: 'Execute practical skill verification, background validation, and medical pre-screening.',
    },
    {
      step: '04',
      title: 'Mobilization & Compliance',
      desc: 'Coordinated flight bookings, immigration entry formalities, and lawful UAE deployment.',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {employerSteps.map((s) => (
        <GlassCard key={s.step} padding="md">
          <span
            style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-family-display)',
              fontWeight: 800,
              color: 'var(--accent-gold-primary)',
              display: 'block',
              marginBottom: 'var(--space-2)',
            }}
          >
            {s.step}
          </span>
          <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            {s.title}
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {s.desc}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
