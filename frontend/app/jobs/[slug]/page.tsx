import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchJobBySlug } from '@/lib/jobs-api';
import { JobDetail } from '@/components/jobs/JobDetail';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { SEED_JOBS } from '@/lib/data/jobs';
import { BreadcrumbJsonLd, JobPostingJsonLd } from '@/components/seo/JsonLd';

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
    alternates: {
      canonical: `/jobs/${params.slug}/`,
    },
    openGraph: {
      title: `${result.job.title} in ${result.job.location} | Cityline Consultancy`,
      description: result.job.overview,
      url: `/jobs/${params.slug}/`,
    },
  };
}

export default async function SingleJobPage({ params }: JobPageProps) {
  const result = await fetchJobBySlug(params.slug);
  if (!result?.job) notFound();

  return (
    <div className="page-wrapper">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Jobs', url: '/jobs/' },
          { name: result.job.title, url: `/jobs/${result.job.slug}/` },
        ]}
      />
      <JobPostingJsonLd
        title={result.job.title}
        description={result.job.overview}
        slug={result.job.slug}
        location={result.job.location}
        salaryRange={result.job.salaryRange}
        hiringOrganization="Cityline Consultancy Client Partner"
      />
      <section className="section-sm">
        <div className="container">
          <JobDetail job={result.job} relatedJobs={result.relatedJobs} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
