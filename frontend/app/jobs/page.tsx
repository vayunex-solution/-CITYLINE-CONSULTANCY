import React from 'react';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { JobList } from '@/components/jobs/JobList';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata: Metadata = {
  title: 'Current Job Opportunities in the UAE',
  description:
    'Browse verified UAE job opportunities across hospitality, cleaning, construction trades, delivery, and professional transport fleets.',
};

export default function JobsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const initialCategory = searchParams.category || '';

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      {/* Hero */}
      <section className="section" style={{ background: 'var(--hero-mesh)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">Career Opportunities</Badge>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-4xl)',
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
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
          >
            Connect directly with verified employment openings across essential operational sectors in Dubai, Abu Dhabi, and the Northern Emirates.
          </p>
        </div>
      </section>

      {/* Main Listing Experience */}
      <section className="section">
        <div className="container">
          <JobList initialCategory={initialCategory} showFilters={true} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
