import React from 'react';
import Link from 'next/link';
import { JobOpportunity } from '@/lib/types/website.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './JobCard.module.css';

interface JobCardProps {
  job: JobOpportunity;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className={`${styles.card} ${job.isFeatured ? styles.featured : ''}`}>
      <div>
        <div className={styles.header}>
          <div className={styles.metaGroup}>
            <Badge variant="gold" size="sm">{job.category}</Badge>
            <Badge variant="slate" size="sm">{job.type}</Badge>
          </div>
          {job.isFeatured && (
            <Badge variant="success" size="sm">Featured</Badge>
          )}
        </div>

        <h3 className={styles.title} style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <Link href={`/jobs/${job.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {job.title}
          </Link>
        </h3>

        <div className={styles.metaRow} style={{ marginBottom: 'var(--space-3)' }}>
          <span className={styles.metaItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{job.location}</span>
          </span>
        </div>

        <p className={styles.desc}>{job.overview}</p>
      </div>

      <div className={styles.footer}>
        <Link
          href={`/jobs/${job.slug}`}
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          View Details
        </Link>
        <Button href={`/jobs/${job.slug}`} size="sm" variant="glass">
          View Opportunity
        </Button>
      </div>
    </article>
  );
}
