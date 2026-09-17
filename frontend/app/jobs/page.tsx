import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { JobList } from '@/components/jobs/JobList';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata: Metadata = {
  title: 'Current Job Opportunities in the UAE',
  description:
    'Browse verified UAE job opportunities across hospitality, cleaning, construction trades, delivery, and professional transport fleets.',
};

export default function JobsPage() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <Breadcrumb items={[{ label: 'Current Jobs' }]} />
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge variant="gold">Career Opportunities</Badge>
              <Badge variant="success">✓ Verified MOHRE Sourced</Badge>
              <Badge variant="slate">Zero Candidate Placement Fee</Badge>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Verified Opportunities in the <span className="text-gradient-gold">UAE.</span>
            </h1>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                maxWidth: '720px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.7,
              }}
            >
              Connect directly with verified employment openings across essential operational sectors in Dubai, Abu Dhabi, and the Northern Emirates with full 2-year employer-sponsored visas.
            </p>
          </div>
        </div>
      </section>

      {/* Main Listing Experience */}
      <section className="section">
        <div className="container">
          <Suspense fallback={<div className="container" style={{ minHeight: '300px' }} />}>
            <JobList showFilters={true} />
          </Suspense>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
