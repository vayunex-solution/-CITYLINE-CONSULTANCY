import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { VisaEnquiryForm } from '@/components/forms/VisaEnquiryForm';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { FAQS } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import Link from 'next/link';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Visa Services Enquiry | Cityline Consultancy',
  description:
    'Submit an official visa consultation enquiry for 2-Year Freelance Visas, 30-day visit visas, and 60-day visit visas in the UAE.',
  alternates: {
    canonical: '/visa-enquiry/',
  },
  openGraph: {
    title: 'Visa Services Enquiry | Cityline Consultancy',
    description:
      'Submit an official visa consultation enquiry for 2-Year Freelance Visas and Visit Visas in the UAE.',
    url: '/visa-enquiry/',
  },
};

export default function VisaEnquiryPage() {
  const visaFaqs = FAQS.filter((f) => f.category === 'visa');

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Visa Services', url: '/visa-services/' },
          { name: 'Visa Enquiry', url: '/visa-enquiry/' },
        ]}
      />
      <FaqJsonLd faqs={visaFaqs.map((f) => ({ question: f.question, answer: f.answer }))} />
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
            <Badge variant="gold" size="md">Procedural Guidance</Badge>
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
              Visa Consultation Enquiry
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
              Connect with our UAE visa advisory team to clarify document readiness, procedural steps, and application timelines for Freelance and Visit permits.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Section */}
      <section style={{ padding: '5rem 0' }}>
        <Container>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '3rem',
              alignItems: 'start',
            }}
          >
            {/* Left: Advisory Guidance & Checklist */}
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--color-gold)',
                  }}
                >
                  Consultation Process
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--color-fg)',
                    marginTop: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  Structured Visa Facilitation
                </h2>
                <p
                  style={{
                    color: 'var(--color-fg-muted)',
                    lineHeight: 1.7,
                    fontSize: '1rem',
                  }}
                >
                  Every individual journey requires accurate paperwork alignment with current UAE immigration policies. Submitting your enquiry initiates a verified procedural review.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Enquiry & Profile Assessment
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        We review your intended visa type, current citizenship, and timeline requirements.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Document Checklist & Preparation
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        Our consultants provide a customized checklist ensuring all passport scans and photos meet regulatory compliance.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Official Filing & Coordination
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        We assist in filing applications through verified channels and track status updates continuously.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(197, 155, 39, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(197, 155, 39, 0.25)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '0.25rem' }}>
                    IMMIGRATION COMPLIANCE NOTE
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                    Cityline Consultancy provides professional documentation and application support services. Final visa approvals, processing durations, and security clearances are under the sole authority of the General Directorate of Residency and Foreigners Affairs (GDRFA) and the Federal Authority for Identity, Citizenship, Customs and Port Security (ICP).
                  </p>
                </div>
              </div>
            </div>

            {/* Right: The Interactive Visa Enquiry Form */}
            <div>
              <GlassCard padding="lg">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: 'var(--color-fg)',
                      margin: 0,
                    }}
                  >
                    Visa Consultation Form
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.35rem 0 0' }}>
                    Select your required visa category and submit your contact information for an advisory review.
                  </p>
                </div>

                <VisaEnquiryForm />
              </GlassCard>
            </div>
          </div>
        </Container>
      </section>

      {/* Relevant FAQs */}
      <section style={{ padding: '4rem 0', background: 'var(--color-surface-subtle)' }}>
        <Container size="narrow">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Badge variant="gold">Visa FAQs</Badge>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-fg)',
                marginTop: '0.75rem',
              }}
            >
              Visa Advisory Questions
            </h2>
          </div>
          <FAQAccordion items={visaFaqs} />
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              href="/visa-services"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
                textDecoration: 'none',
              }}
            >
              Review all Visa Services →
            </Link>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </main>
  );
}
