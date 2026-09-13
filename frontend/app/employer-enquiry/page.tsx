import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmployerEnquiryForm } from '@/components/forms/EmployerEnquiryForm';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { FAQS } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Employer Manpower Enquiry | Cityline Consultancy',
  description:
    'UAE corporate workforce and manpower recruitment solutions. Source skilled and semi-skilled personnel across hospitality, facility management, construction, and logistics.',
};

export default function EmployerEnquiryPage() {
  const recruitmentFaqs = FAQS.filter((f) => f.category === 'recruitment');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'hotel': return '🏨';
      case 'sparkles': return '🧹';
      case 'brick': return '🧱';
      case 'hammer': return '🏗️';
      case 'axe': return '🪚';
      case 'bike': return '🛵';
      case 'car': return '🚕';
      case 'truck': return '🚛';
      default: return '💼';
    }
  };

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
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <Badge variant="gold" size="md">Corporate Manpower Solutions</Badge>
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
              Enterprise Workforce Deployment
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--color-fg-muted)',
                lineHeight: 1.7,
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              Cityline Consultancy connects UAE employers with structured talent sourcing across India and regional hubs. We coordinate recruitment pipelines tailored to project schedules and regulatory compliance.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Form & Corporate Briefing */}
      <section style={{ padding: '5rem 0' }}>
        <Container>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Sourcing Protocol & Supported Sectors */}
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
                  Workforce Architecture
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
                  Reliable Deployment Pipelines
                </h2>
                <p
                  style={{
                    color: 'var(--color-fg-muted)',
                    lineHeight: 1.7,
                    fontSize: '1rem',
                  }}
                >
                  From individual specialist roles to large-scale operational teams, our recruitment methodology ensures candidates possess validated practical competency and verified background credentials.
                </p>
              </div>

              {/* Supported Operational Sectors Grid */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-fg)', marginBottom: '1rem' }}>
                  Confirmed Manpower Sectors:
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {MANPOWER_CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{getCategoryIcon(cat.iconName)}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg)' }}>
                        {cat.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruitment Standards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <GlassCard padding="md" hoverable={false}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      🛠️
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Practical Trade Testing
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        Technical candidates undergo hands-on practical assessments in accredited workshops prior to interview shortlisting.
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
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gold-muted)',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      📜
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-fg)', margin: 0 }}>
                        Documentation & Visa Mobilization
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-fg-muted)', margin: '0.25rem 0 0', lineHeight: 1.5 }}>
                        Full coordination of medical fitness, emigration clearance, and arrival briefing to ensure seamless day-one onboarding.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Right Column: Employer Requirement Form */}
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
                    Submit Corporate Hiring Requirements
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.35rem 0 0' }}>
                    Provide your hiring scope below. Our corporate relations director will respond with deployment availability.
                  </p>
                </div>

                <EmployerEnquiryForm />
              </GlassCard>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQs */}
      <section style={{ padding: '4rem 0', background: 'var(--color-surface-subtle)' }}>
        <Container size="narrow">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Badge variant="gold">Recruitment Guidance</Badge>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-fg)',
                marginTop: '0.75rem',
              }}
            >
              Employer Recruitment FAQs
            </h2>
          </div>
          <FAQAccordion items={recruitmentFaqs} />
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              href="/recruitment"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-gold)',
                textDecoration: 'none',
              }}
            >
              Explore our recruitment ecosystem →
            </Link>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </main>
  );
}
