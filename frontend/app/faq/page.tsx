import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { FAQS } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import Link from 'next/link';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Cityline Consultancy',
  description:
    'Verified procedural information and guidance regarding UAE Visa Services, Company Formation, and Manpower Recruitment.',
  alternates: {
    canonical: '/faq/',
  },
  openGraph: {
    title: 'Frequently Asked Questions | Cityline Consultancy',
    description:
      'Verified procedural information and guidance regarding UAE Visa Services, Company Formation, and Manpower Recruitment.',
    url: '/faq/',
  },
};

export default function FAQPage() {
  const visaFaqs = FAQS.filter((f) => f.category === 'visa');
  const businessFaqs = FAQS.filter((f) => f.category === 'business');
  const recruitmentFaqs = FAQS.filter((f) => f.category === 'recruitment');
  const generalFaqs = FAQS.filter((f) => f.category === 'general');

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Frequently Asked Questions', url: '/faq/' },
        ]}
      />
      <FaqJsonLd faqs={FAQS.map((f) => ({ question: f.question, answer: f.answer }))} />
      {/* Hero Section */}
      <section
        style={{
          paddingTop: 'calc(var(--nav-height) + 4rem)',
          paddingBottom: '4rem',
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(197, 155, 39, 0.12), transparent 70%), var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Container>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <Badge variant="gold" size="md">Knowledge & Advisory</Badge>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                color: 'var(--color-fg)',
                lineHeight: 1.1,
                margin: '1.25rem 0 1rem',
                letterSpacing: '-0.02em',
              }}
            >
              Frequently Asked Questions
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--color-fg-muted)',
                lineHeight: 1.7,
                maxWidth: '650px',
                margin: '0 auto',
              }}
            >
              Clear, factual answers regarding Cityline Consultancy service scopes, procedural steps, and regulatory standards.
            </p>
          </div>
        </Container>
      </section>

      {/* Categorized FAQs */}
      <section style={{ padding: '5rem 0' }}>
        <Container size="narrow">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {/* General Overview */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--color-gold)',
                  }}
                >
                  Overview
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-fg)',
                    marginTop: '0.25rem',
                  }}
                >
                  General & Operational Scope
                </h2>
              </div>
              <FAQAccordion items={generalFaqs} />
            </div>

            {/* Visa Services */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--color-gold)',
                  }}
                >
                  Residency & Entry Permits
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-fg)',
                    marginTop: '0.25rem',
                  }}
                >
                  Visa Services & Compliance
                </h2>
              </div>
              <FAQAccordion items={visaFaqs} />
              <div style={{ marginTop: '1rem' }}>
                <Link
                  href="/visa-services"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                  }}
                >
                  Explore detailed Visa Services breakdown →
                </Link>
              </div>
            </div>

            {/* Business Setup */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--color-gold)',
                  }}
                >
                  Enterprise Establishment
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-fg)',
                    marginTop: '0.25rem',
                  }}
                >
                  Business Setup & Formation
                </h2>
              </div>
              <FAQAccordion items={businessFaqs} />
              <div style={{ marginTop: '1rem' }}>
                <Link
                  href="/business-setup"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                  }}
                >
                  Learn more about UAE Business Setup pathways →
                </Link>
              </div>
            </div>

            {/* Recruitment */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--color-gold)',
                  }}
                >
                  Talent & Deployment
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-fg)',
                    marginTop: '0.25rem',
                  }}
                >
                  Recruitment & UAE Manpower
                </h2>
              </div>
              <FAQAccordion items={recruitmentFaqs} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <Link
                  href="/jobs"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                  }}
                >
                  Browse Candidate Job Opportunities →
                </Link>
                <Link
                  href="/employer-enquiry"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-gold)',
                    textDecoration: 'none',
                  }}
                >
                  Submit Employer Workforce Requirements →
                </Link>
              </div>
            </div>

            {/* Regulatory Disclaimer Card */}
            <GlassCard padding="md" hoverable={false}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="13" y2="16" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                    Official Advisory & Governance Notice
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.35rem 0 0', lineHeight: 1.6 }}>
                    Information provided on this portal is for general procedural guidance and does not constitute formal legal immigration or corporate counsel. Eligibility assessments, document checks, and formal filings are coordinated directly during one-on-one consultations in accordance with official UAE regulatory authority standards.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </main>
  );
}
