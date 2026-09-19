import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJobBySlug, fetchPublishedJobs } from '@/lib/jobs-api';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { JobApplicationForm } from '@/components/forms/JobApplicationForm';
import { SEED_JOBS } from '@/lib/data/jobs';

interface JobApplyPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  try {
    const res = await fetchPublishedJobs({ limit: 50 });
    const liveSlugs = (res.jobs || []).map((j) => ({ slug: j.slug }));
    const seedSlugs = SEED_JOBS.map((j) => ({ slug: j.slug }));
    const map = new Map<string, { slug: string }>();
    [...liveSlugs, ...seedSlugs].forEach((item) => {
      if (item.slug) map.set(item.slug, item);
    });
    return Array.from(map.values());
  } catch {
    return SEED_JOBS.map((job) => ({
      slug: job.slug,
    }));
  }
}

export async function generateMetadata({ params }: JobApplyPageProps): Promise<Metadata> {
  const result = await fetchJobBySlug(params.slug);
  if (!result?.job) return { title: 'Opportunity Not Found' };

  return {
    title: `Apply: ${result.job.title}`,
    description: `Submit your candidate profile for ${result.job.title} in ${result.job.location} via Cityline Consultancy.`,
  };
}

export default async function JobApplyPage({ params }: JobApplyPageProps) {
  const result = await fetchJobBySlug(params.slug);
  if (!result?.job) notFound();
  const job = result.job;

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <Breadcrumb
              items={[
                { label: 'Current Jobs', href: '/jobs' },
                { label: job.title, href: `/jobs/${job.slug}` },
                { label: 'Apply' },
              ]}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Badge variant="gold">Trade Candidate Portal</Badge>
            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: 'var(--space-3)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Candidate Registration: <span className="text-gradient-gold">{job.title}</span>
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Location: <strong>{job.location}</strong> • Trade: <strong>{job.category}</strong> • 2-Year UAE Employment Visa
            </p>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="section">
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Quick Process Steps Banner */}
          <div
            className="glass-panel"
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-6)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', fontWeight: 700 }}>STEP 1</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>Profile Submission</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>STEP 2</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Trade Pre-Screening</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>STEP 3</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Employer Interview & Visa</div>
            </div>
          </div>

          <GlassCard padding="lg" subtleGlow>
            <JobApplicationForm job={job} />
          </GlassCard>

          {/* Security & Ethical Advisory */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-4)',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span><strong>Candidate Data Confidentiality:</strong> Your information is handled securely and used solely for lawful UAE employment evaluation by Cityline Consultancy and verified sponsoring employers. Zero placement fees are ever collected from candidates.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
