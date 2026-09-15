import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobBySlug, SEED_JOBS } from '@/lib/data/jobs';
import { JobDetail } from '@/components/jobs/JobDetail';
import { FinalCTA } from '@/components/sections/FinalCTA';

interface JobPageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: JobPageProps): Metadata {
  const job = getJobBySlug(params.slug);
  if (!job) {
    return {
      title: 'Opportunity Not Found',
    };
  }

  return {
    title: `${job.title} in ${job.location}`,
    description: job.overview,
  };
}

export default function SingleJobPage({ params }: JobPageProps) {
  const job = getJobBySlug(params.slug);
  if (!job) notFound();

  const allOther = SEED_JOBS.filter((j) => j.slug !== job.slug);
  const sameCategory = allOther.filter((j) => j.category === job.category);
  const relatedJobs = (sameCategory.length > 0 ? sameCategory : allOther).slice(0, 3);

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      <section className="section">
        <div className="container">
          <JobDetail job={job} relatedJobs={relatedJobs} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
