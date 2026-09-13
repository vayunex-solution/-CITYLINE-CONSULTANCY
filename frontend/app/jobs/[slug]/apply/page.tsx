import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobBySlug } from '@/lib/data/jobs';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';

interface JobApplyPageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: JobApplyPageProps): Metadata {
  const job = getJobBySlug(params.slug);
  if (!job) return { title: 'Opportunity Not Found' };

  return {
    title: `Apply: ${job.title}`,
    description: `Submit your candidate profile for ${job.title} in ${job.location} via Cityline Consultancy.`,
  };
}

export default function JobApplyPage({ params }: JobApplyPageProps) {
  const job = getJobBySlug(params.slug);
  if (!job) notFound();

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      <section className="section" style={{ background: 'var(--hero-mesh)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">Application Portal</Badge>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: 'var(--space-3)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Apply for: <span className="text-gradient-gold">{job.title}</span>
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Location: {job.location} • Category: {job.category}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '780px' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <Link
              href={`/jobs/${job.slug}`}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-gold-primary)',
                textDecoration: 'none',
              }}
            >
              ← Back to Job Description
            </Link>
          </div>

          <GlassCard padding="lg" subtleGlow>
            <JobApplicationForm job={job} />
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
