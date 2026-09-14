import React from 'react';
import { JobOpportunity } from '@/lib/types/website.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

interface JobDetailProps {
  job: JobOpportunity;
}

export function JobDetail({ job }: JobDetailProps) {
  // Construct conditional Schema.org JobPosting structured data
  // Guaranteed: Zero fabricated employers, salaries, or guarantees
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.overview,
    datePosted: job.publishedAt ? new Date(job.publishedAt).toISOString().split('T')[0] : '2026-09-01',
    validThrough: '2027-12-31',
    employmentType: job.type === 'Full-Time' ? 'FULL_TIME' : job.type === 'Part-Time' ? 'PART_TIME' : 'OTHER',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Cityline Consultancy',
      sameAs: 'https://citylineconsultancy.com',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location.includes('Dubai') ? 'Dubai' : job.location,
        addressCountry: 'AE',
      },
    },
  };

  if (job.qualification) {
    jsonLd.qualifications = job.qualification;
  }
  if (job.responsibilities && job.responsibilities.length > 0) {
    jsonLd.responsibilities = job.responsibilities.join('. ');
  }
  if (job.requirements && job.requirements.length > 0) {
    jsonLd.experienceRequirements = job.requirements.join('. ');
  }
  // Only emit salary if genuine salary data exists
  if (job.salaryRange && !job.salaryRange.toLowerCase().includes('competitive') && !job.salaryRange.toLowerCase().includes('industry standard')) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'AED',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salaryRange,
        unitText: 'MONTH',
      },
    };
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)' }}>
      {/* Schema.org JobPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Banner */}
      <GlassCard padding="lg" subtleGlow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="gold">{job.category}</Badge>
            <Badge variant="slate">{job.type}</Badge>
            <Badge variant="outline">📍 {job.location}</Badge>
            {job.experienceYearsRequired !== undefined && (
              <Badge variant="outline">🛠️ {job.experienceYearsRequired}+ Yrs Exp</Badge>
            )}
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
              Apply for this Trade Opportunity
            </Button>
            <Button href="/jobs" size="lg" variant="glass">
              Browse All Trade Jobs
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Meta Specs if present */}
      {(job.qualification || job.salaryRange || job.benefits) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {job.qualification && (
            <div className="glass-panel" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Qualification
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {job.qualification}
              </div>
            </div>
          )}
          {job.salaryRange && (
            <div className="glass-panel" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Salary Structure
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {job.salaryRange}
              </div>
            </div>
          )}
          {job.benefits && (
            <div className="glass-panel" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Statutory Benefits
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {job.benefits}
              </div>
            </div>
          )}
        </div>
      )}

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
            Trade Responsibilities
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
        <strong>Recruitment Advisory:</strong> Cityline Consultancy operates strictly in accordance with ethical recruitment principles and UAE Ministry of Human Resources regulations. Candidates are evaluated purely on genuine trade competence, verified credentials, and legal eligibility. We do not charge unauthorized placement fees or guarantee outcomes.
      </div>
    </div>
  );
}
