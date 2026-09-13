import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export function CandidateJourney() {
  const candidateSteps = [
    {
      step: '01',
      title: 'Profile & Trade Assessment',
      desc: 'Evaluate trade credentials, licensing requirements, and passport validity for UAE readiness.',
    },
    {
      step: '02',
      title: 'Vacancy Alignment',
      desc: 'Match your verified qualifications with active UAE operational and employer requirements.',
    },
    {
      step: '03',
      title: 'Documentation & Visa Processing',
      desc: 'Coordinate medical examinations, visa typing, and travel clearance documentation.',
    },
    {
      step: '04',
      title: 'Arrival & Employment Onboarding',
      desc: 'Travel guidance to the UAE, employer reporting, and initial residency onboarding.',
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
      {candidateSteps.map((s) => (
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
