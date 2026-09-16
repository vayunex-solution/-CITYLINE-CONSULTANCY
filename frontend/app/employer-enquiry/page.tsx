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

  const renderCategoryIcon = (iconName: string) => {
    const props = {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'var(--accent-gold-primary)',
      strokeWidth: 1.75,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (iconName) {
      case 'hotel':
        return <svg {...props}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" /></svg>;
      case 'sparkles':
        return <svg {...props}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>;
      case 'brick':
        return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="14" x2="21" y2="14" /><line x1="9" y1="4" x2="9" y2="9" /><line x1="15" y1="4" x2="15" y2="9" /><line x1="6" y1="9" x2="6" y2="14" /><line x1="12" y1="9" x2="12" y2="14" /><line x1="18" y1="9" x2="18" y2="14" /></svg>;
      case 'hammer':
        return <svg {...props}><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" /><path d="M17.64 4.36a3 3 0 0 0-4.24 0L12 5.76l6.24 6.24 1.4-1.4a3 3 0 0 0 0-4.24z" /></svg>;
      case 'axe':
        return <svg {...props}><path d="M14 2l6 6-4 4-6-6 4-4z" /><path d="M10 8L3 15l6 6 7-7" /></svg>;
      case 'bike':
        return <svg {...props}><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M9 17h6M12 17V9l3 3h4M12 9L9 5H6" /></svg>;
      case 'car':
        return <svg {...props}><rect x="3" y="11" width="18" height="7" rx="2" /><path d="M5 11l2-5h10l2 5M7 18v2M17 18v2" /></svg>;
      case 'truck':
        return <svg {...props}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
      default:
        return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
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
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>
                        {renderCategoryIcon(cat.iconName)}
                      </div>
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
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
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
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
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
