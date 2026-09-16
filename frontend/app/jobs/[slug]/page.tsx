import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJobBySlug } from '@/lib/jobs-api';
import { JobDetail } from '@/components/jobs/JobDetail';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { SEED_JOBS } from '@/lib/data/jobs';

interface JobPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return SEED_JOBS.map((job) => ({
    slug: job.slug,
  }));
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const result = await fetchJobBySlug(params.slug);
  if (!result?.job) {
    return {
      title: 'Opportunity Not Found',
    };
  }

  return {
    title: `${result.job.title} in ${result.job.location}`,
    description: result.job.overview,
  };
}

export default async function SingleJobPage({ params }: JobPageProps) {
  const result = await fetchJobBySlug(params.slug);
  if (!result?.job) notFound();

  return (
    <div style={{ paddingTop: '72px' }}>
      <section className="section-sm">
        <div className="container">
          <JobDetail job={result.job} relatedJobs={result.relatedJobs} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
