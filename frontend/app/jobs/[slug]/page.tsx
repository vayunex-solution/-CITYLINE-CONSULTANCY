import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobBySlug } from '@/lib/data/jobs';
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

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      <section className="section">
        <div className="container">
          <JobDetail job={job} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
