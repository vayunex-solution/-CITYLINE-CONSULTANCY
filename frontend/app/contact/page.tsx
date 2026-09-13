import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { ContactForm } from '@/components/forms/ContactForm';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { FAQS } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Cityline Consultancy | UAE Opportunity & Advisory',
  description:
    'Connect with Cityline Consultancy for verified assistance on UAE Freelance Visas, Visit Visas, Company Formation, and Manpower Recruitment.',
};

export default function ContactPage() {
  const contactFaqs = FAQS.filter((f) => f.category === 'general');

  return (
    <main>
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
            <Badge variant="gold" size="md">Direct Consultation</Badge>
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
              Start the Conversation.<br />
              <span className="gold-gradient-text">Shape Your UAE Future.</span>
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
              Whether you are an individual planning relocation, an entrepreneur establishing an enterprise, or an employer requiring verified workforce deployment, our advisory desk is ready to assist.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content: Split Layout */}
      <section style={{ padding: '5rem 0' }}>
        <Container>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'start',
            }}
          >
            {/* Left: Consultation Guidance & Official Channels */}
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
                  Consultation Protocol
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
                  Direct Advisory Channels
                </h2>
                <p
                  style={{
                    color: 'var(--color-fg-muted)',
                    lineHeight: 1.7,
                    fontSize: '1rem',
                  }}
                >
                  We treat every enquiry with strict procedural rigor. Once submitted, our specialist team reviews your profile and coordinates an official structured advisory response.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Visa & Residency Guidance
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        Dedicated guidance for 2-Year Freelance Visas, 30-day visit permits, and 60-day visit permits.
                      </p>
                      <Link
                        href="/visa-enquiry"
                        style={{
                          display: 'inline-block',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--color-gold)',
                          marginTop: '0.5rem',
                        }}
                      >
                        Specialized Visa Enquiry Form →
                      </Link>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                      }}
                    >
                      🏢
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Corporate & Employer Desk
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        For UAE enterprise entity formation and high-volume manpower recruitment requirements.
                      </p>
                      <Link
                        href="/employer-enquiry"
                        style={{
                          display: 'inline-block',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--color-gold)',
                          marginTop: '0.5rem',
                        }}
                      >
                        Corporate Employer Enquiry Form →
                      </Link>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                      }}
                    >
                      🛡️
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Regulatory Governance Note
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        Cityline Consultancy operates within structured compliance frameworks. We do not solicit unofficial fees, guarantee sovereign approvals, or accept unverified documentation.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Right: The Interactive Contact Form Shell */}
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
                    Send an Official Consultation Enquiry
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.35rem 0 0' }}>
                    Complete the form below. All fields are handled with strict confidentiality.
                  </p>
                </div>

                <ContactForm />
              </GlassCard>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Preview */}
      <section style={{ padding: '4rem 0', background: 'var(--color-surface-subtle)' }}>
        <Container size="narrow">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Badge variant="gold">Quick Answers</Badge>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-fg)',
                marginTop: '0.75rem',
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={contactFaqs} />
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              href="/faq"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
                textDecoration: 'none',
              }}
            >
              View complete FAQ index →
            </Link>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </main>
  );
}
