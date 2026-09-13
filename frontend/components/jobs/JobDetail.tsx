import React from 'react';
import { JobOpportunity } from '@/lib/types/website.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

interface JobDetailProps {
  job: JobOpportunity;
}

export function JobDetail({ job }: JobDetailProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)' }}>
      {/* Header Banner */}
      <GlassCard padding="lg" subtleGlow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="gold">{job.category}</Badge>
            <Badge variant="slate">{job.type}</Badge>
            <Badge variant="outline">📍 {job.location}</Badge>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {job.title}
          </h1>

          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {job.overview}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            <Button href={`/jobs/${job.slug}/apply`} size="lg" variant="primary">
              Apply for this Opportunity
            </Button>
            <Button href="/jobs" size="lg" variant="glass">
              Browse All Jobs
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Main Content Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {/* Responsibilities */}
        <GlassCard padding="lg">
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Role Responsibilities
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {job.responsibilities.map((resp, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--accent-gold-primary)', fontWeight: 700 }}>•</span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Requirements */}
        <GlassCard padding="lg">
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Candidate Requirements
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {job.requirements.map((req, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {/* Guidance Note */}
      <div
        className="glass-panel"
        style={{
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong>Recruitment Advisory:</strong> Cityline Consultancy coordinates directly with verified UAE employer sponsors. In compliance with ethical recruitment principles and UAE Ministry of Human Resources regulations, candidates are evaluated purely on verified trade skills and lawful credentials.
      </div>
    </div>
  );
}
