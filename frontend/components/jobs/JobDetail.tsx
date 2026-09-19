import React from 'react';
import Link from 'next/link';
import { JobOpportunity } from '@/lib/types/website.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { JobCard } from '@/components/jobs/JobCard';
import styles from './JobDetail.module.css';

/* ── Professional 2D SVG Icons (No Emojis) ── */
const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" />
  </svg>
);
const IconWrench = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconBus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="14" rx="2" /><path d="M3 10h18" /><circle cx="7" cy="15" r="1" /><circle cx="17" cy="15" r="1" /><path d="M5 17v3M19 17v3" />
  </svg>
);
const IconHospital = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8M8 12h8" />
  </svg>
);
const IconPlane = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.1.5l-.7 1.4 5.3 3.6L6 15l-2.4-.6c-.4-.1-.8.1-.9.5l-.4.8 2.6 1.8 1.8 2.6c.4.6.9.6 1.3.2l.6-2.4 2.8-2.8 3.6 5.3c.4.6 1 .6 1.4.1l1.4-.7c.4-.2.6-.6.5-1.1z" />
  </svg>
);
const IconScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v18M6 8l6-5 6 5M3 14l3-6 3 6a3 3 0 0 1-6 0zM15 14l3-6 3 6a3 3 0 0 1-6 0z" />
  </svg>
);
const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

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

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Jobs & Openings', href: '/jobs' },
    { label: job.title },
  ];

  const whatsappMessage = encodeURIComponent(
    `Hello Cityline Consultancy, I am interested in applying for: ${job.title} (${job.location}). Please share details on next mobilization steps.`
  );
  const whatsappUrl = `https://wa.me/971500000000?text=${whatsappMessage}`;

  return (
    <article className={styles.page}>
      {/* Schema.org JobPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumbWrap}>
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Hero Header */}
      <header className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.badgesRow}>
            <Badge variant="gold">{job.category}</Badge>
            <Badge variant="slate">{job.type}</Badge>
            <Badge variant="outline"><IconPin />{job.location}</Badge>
            <Badge variant="success">Verified Employer Opening</Badge>
          </div>

          <h1 className={styles.title}>{job.title}</h1>

          <p className={styles.overview}>{job.overview}</p>

          {/* Quick Specs Ribbon */}
          <div className={styles.specsRibbon}>
            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true"><IconMoney /></span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Remuneration</span>
                <span className={styles.specValue}>{job.salaryRange || 'Competitive Market Rate'}</span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true"><IconWrench /></span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Required Experience</span>
                <span className={styles.specValue}>
                  {job.experienceYearsRequired !== undefined && job.experienceYearsRequired !== null
                    ? (Number(job.experienceYearsRequired) === 0 ? 'Fresher / Entry-Level' : `${job.experienceYearsRequired}+ Years Practical`)
                    : 'Trade Certified'}
                </span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true"><IconDoc /></span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Visa Sponsorship</span>
                <span className={styles.specValue}>{job.visaSponsorship || '2-Year UAE Employment Visa'}</span>
              </div>
            </div>

            <div className={styles.specItem}>
              <span className={styles.specIcon} aria-hidden="true"><IconClock /></span>
              <div className={styles.specText}>
                <span className={styles.specLabel}>Work Shift</span>
                <span className={styles.specValue}>{job.workShift || '8 Hrs/Day + Overtime (UAE Law)'}</span>
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
              <span className={styles.sectionIcon} aria-hidden="true"><IconClipboard /></span>
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
              <span className={styles.sectionIcon} aria-hidden="true"><IconTarget /></span>
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
              <span className={styles.sectionIcon} aria-hidden="true"><IconShield /></span>
              <h2 id="benefits-heading" className={styles.sectionTitle}>
                Statutory Working Conditions & Benefits
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              All benefits are provided in strict compliance with the United Arab Emirates Ministry of Human Resources &amp; Emiratisation (MOHRE) regulatory standard:
            </p>
            {job.benefits && (
              <div style={{ padding: '0.85rem 1.15rem', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--accent-gold-primary)' }}>Role-Specific Provisions &amp; Allowances:</strong> {job.benefits}
              </div>
            )}
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true"><IconHome /></span>
                <div>
                  <h3 className={styles.benefitTitle}>Company Accommodation</h3>
                  <p className={styles.benefitDesc}>Clean, safe corporate accommodation provided by employer.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true"><IconBus /></span>
                <div>
                  <h3 className={styles.benefitTitle}>Daily Transportation</h3>
                  <p className={styles.benefitDesc}>AC commute buses between accommodation and work sites.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true"><IconHospital /></span>
                <div>
                  <h3 className={styles.benefitTitle}>Health Insurance</h3>
                  <p className={styles.benefitDesc}>Mandatory UAE corporate medical insurance cover.</p>
                </div>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon} aria-hidden="true"><IconPlane /></span>
                <div>
                  <h3 className={styles.benefitTitle}>Return Flight Allowance</h3>
                  <p className={styles.benefitDesc}>Biennial round-trip airfare upon contract completion.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Ethical Recruitment Compliance Notice */}
          <div className={styles.complianceNotice}>
            <span className={styles.complianceIcon} aria-hidden="true"><IconScale /></span>
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
                  <span aria-hidden="true"><IconChat /></span>
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
    </article>
  );
}
