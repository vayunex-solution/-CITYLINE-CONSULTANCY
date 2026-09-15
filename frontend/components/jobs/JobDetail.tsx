import React from 'react';
import Link from 'next/link';
import { JobOpportunity } from '@/lib/types/website.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { JobCard } from '@/components/jobs/JobCard';
import styles from './JobDetail.module.css';

interface JobDetailProps {
  job: JobOpportunity;
  relatedJobs?: JobOpportunity[];
}

export function JobDetail({ job, relatedJobs = [] }: JobDetailProps) {
  // Schema.org JobPosting structured data
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
        addressLocality: job.location.includes('Dubai') ? 'Dubai' : job.location.split(',')[0].trim(),
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

  const whatsappText = encodeURIComponent(
    `Hello Cityline Consultancy, I am interested in applying for "${job.title}" (${job.location}). Please guide me through the trade credentials assessment process.`
  );
  const whatsappUrl = `https://wa.me/971501234567?text=${whatsappText}`;

  return (
    <div className={styles.wrapper}>
      {/* Schema.org JobPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Current Jobs', href: '/jobs' },
          { label: job.category, href: `/jobs?category=${encodeURIComponent(job.category)}` },
          { label: job.title },
        ]}
      />

      {/* Hero Card */}
      <header className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.badgesRow}>
            <Badge variant="gold">{job.category}</Badge>
            <Badge variant="slate">{job.type}</Badge>
            <Badge variant="outline">📍 {job.location}</Badge>
            <Badge variant="success">✓ Verified Employer Opening</Badge>
          </div>

          <h1 className={styles.title}>{job.title}</h1>

          <p className={styles.overview}>{job.overview}</p>

          {/* Quick Specs Ribbon */}
          <div className={styles.specsRibbon}>
            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true">💰</span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Remuneration</span>
                <span className={styles.specValue}>{job.salaryRange || 'Competitive Market Rate'}</span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true">🛠️</span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Required Experience</span>
                <span className={styles.specValue}>
                  {job.experienceYearsRequired !== undefined ? `${job.experienceYearsRequired}+ Years Practical` : 'Trade Certified'}
                </span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true">📄</span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Visa Sponsorship</span>
                <span className={styles.specValue}>2-Year UAE Employment Visa</span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true">⏱️</span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Work Shift</span>
                <span className={styles.specValue}>8 Hrs/Day + Overtime (UAE Law)</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Responsibilities, Requirements, Benefits, Advisory */}
        <div className={styles.contentColumn}>
          {/* Trade Responsibilities */}
          <section className={styles.sectionCard} aria-labelledby="resp-heading">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} aria-hidden="true">📋</span>
              <h2 id="resp-heading" className={styles.sectionTitle}>
                Key Trade Responsibilities
              </h2>
            </div>
            <ul className={styles.bulletList}>
              {job.responsibilities.map((resp, i) => (
                <li key={i} className={styles.bulletItem}>
                  <span className={styles.bulletGold} aria-hidden="true">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Candidate Requirements */}
          <section className={styles.sectionCard} aria-labelledby="req-heading">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} aria-hidden="true">🎯</span>
              <h2 id="req-heading" className={styles.sectionTitle}>
                Candidate Requirements & Eligibility
              </h2>
            </div>
            <ul className={styles.bulletList}>
              {job.requirements.map((req, i) => (
                <li key={i} className={styles.bulletItem}>
                  <span className={styles.bulletCheck} aria-hidden="true">✓</span>
                  <span>{req}</span>
                </li>
              ))}
              {job.qualification && (
                <li className={styles.bulletItem}>
                  <span className={styles.bulletCheck} aria-hidden="true">✓</span>
                  <span><strong>Educational Background:</strong> {job.qualification}</span>
                </li>
              )}
              <li className={styles.bulletItem}>
                <span className={styles.bulletCheck} aria-hidden="true">✓</span>
                <span>Valid passport with at least 6 months remaining validity at mobilization.</span>
              </li>
            </ul>
          </section>

          {/* Statutory Benefits Grid */}
          <section className={styles.sectionCard} aria-labelledby="benefits-heading">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} aria-hidden="true">🛡️</span>
              <h2 id="benefits-heading" className={styles.sectionTitle}>
                Statutory Working Conditions & Benefits
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              All benefits are provided in strict compliance with the United Arab Emirates Ministry of Human Resources & Emiratisation (MOHRE) regulatory standard:
            </p>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true">🏠</span>
                <div>
                  <h3 className={styles.benefitTitle}>Company Accommodation</h3>
                  <p className={styles.benefitDesc}>Clean, safe corporate accommodation provided by employer.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true">🚌</span>
                <div>
                  <h3 className={styles.benefitTitle}>Daily Transportation</h3>
                  <p className={styles.benefitDesc}>AC commute buses between accommodation and work sites.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true">🏥</span>
                <div>
                  <h3 className={styles.benefitTitle}>Health Insurance</h3>
                  <p className={styles.benefitDesc}>Mandatory UAE corporate medical insurance cover.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true">✈️</span>
                <div>
                  <h3 className={styles.benefitTitle}>Return Flight Allowance</h3>
                  <p className={styles.benefitDesc}>Biennial round-trip airfare upon contract completion.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Ethical Recruitment Compliance Notice */}
          <div className={styles.complianceNotice}>
            <span className={styles.complianceIcon} aria-hidden="true">⚖️</span>
            <div className={styles.complianceText}>
              <h3 className={styles.complianceHeading}>Zero Placement Fee Guarantee</h3>
              <p className={styles.compliancePara}>
                Cityline Consultancy operates under strict ethical recruitment principles and UAE Ministry of Human Resources guidelines. <strong>We do not charge candidates unauthorized placement fees</strong>, nor do we confiscate passports. Candidates are screened purely on authentic trade competence, genuine documentation, and legal eligibility.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className={styles.sidebarColumn}>
          <div className={styles.stickyBox}>
            {/* Action Box */}
            <div className={styles.applyCard}>
              <div className={styles.applyHeader}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Next Steps
                </span>
                <h3 className={styles.applyTitle}>Ready to Mobilize?</h3>
                <p className={styles.applySub}>
                  Submit your candidate details for pre-screening and trade credentials verification.
                </p>
              </div>

              <div className={styles.applyActions}>
                <Button href={`/jobs/${job.slug}/apply`} size="lg" variant="primary">
                  Apply for this Trade Opportunity →
                </Button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappButton}
                >
                  <span aria-hidden="true">💬</span>
                  <span>Enquire via WhatsApp</span>
                </a>
              </div>

              <ul className={styles.trustList}>
                <li className={styles.trustItem}>
                  <span className={styles.trustIcon}>✓</span>
                  <span>Free candidate application</span>
                </li>
                <li className={styles.trustItem}>
                  <span className={styles.trustIcon}>✓</span>
                  <span>Direct employer sponsorship</span>
                </li>
                <li className={styles.trustItem}>
                  <span className={styles.trustIcon}>✓</span>
                  <span>Full visa processing support</span>
                </li>
              </ul>
            </div>

            {/* Snapshot Card */}
            <div className={styles.snapshotCard}>
              <h3 className={styles.snapshotTitle}>Opening Snapshot</h3>
              <div className={styles.snapshotRows}>
                <div className={styles.snapshotRow}>
                  <span className={styles.snapshotKey}>Sector</span>
                  <span className={styles.snapshotVal}>{job.category}</span>
                </div>
                <div className={styles.snapshotRow}>
                  <span className={styles.snapshotKey}>Location</span>
                  <span className={styles.snapshotVal}>{job.location}</span>
                </div>
                <div className={styles.snapshotRow}>
                  <span className={styles.snapshotKey}>Contract Type</span>
                  <span className={styles.snapshotVal}>2-Year Renewable</span>
                </div>
                <div className={styles.snapshotRow}>
                  <span className={styles.snapshotKey}>Salary Scale</span>
                  <span className={styles.snapshotVal}>{job.salaryRange || 'Competitive'}</span>
                </div>
                <div className={styles.snapshotRow}>
                  <span className={styles.snapshotKey}>Reference</span>
                  <span className={styles.snapshotVal}>CLC-{job.id.toUpperCase()}</span>
                </div>
              </div>

              <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                <Link
                  href="/jobs"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-gold-primary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  ← Browse all open vacancies
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Opportunities */}
      {relatedJobs.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>Similar Trade Opportunities</h2>
          <div className={styles.relatedGrid}>
            {relatedJobs.map((rel) => (
              <JobCard key={rel.id} job={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
