import React from 'react';
import type { Metadata } from 'next';
import { BUSINESS_SETUP_SERVICES } from '@/lib/data/business-setup';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { getFAQsByCategory } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { JourneyIndicator } from '@/components/hero/JourneyIndicator';

export const metadata: Metadata = {
  title: 'UAE Company Formation & Business Setup Advisory',
  description:
    'Turnkey corporate formation and business setup advisory across Dubai and the UAE. Licensing, registration, and investor visa coordination by Cityline Consultancy.',
};

export default function BusinessSetupPage() {
  const businessFaqs = getFAQsByCategory('business');

  return (
    <div style={{ paddingTop: '72px' }}>
      {/* Hero */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">Commercial Advisory</Badge>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-4xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
            }}
          >
            UAE Business Setup & <span className="text-gradient-gold">Company Formation.</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
              marginBottom: 'var(--space-6)',
            }}
          >
            Strategic corporate advisory guiding founders and established enterprises through commercial structure selection, licensing authorities, and turnkey operational enablement in the Emirates.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
            <Button href="/contact" size="lg" variant="primary">
              Book Business Consultation
            </Button>
            <Button href="/visa-services" size="lg" variant="glass">
              Investor & Partner Visas
            </Button>
          </div>

          <JourneyIndicator />
        </div>
      </section>

      {/* Services Breakdown */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Advisory Scope"
            title={
              <>
                Two Structured Pathways to <span className="text-gradient-gold">UAE Incorporation.</span>
              </>
            }
            description="From initial statutory classification to complete operational readiness, explore our structured business advisory tiers."
            align="center"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-12)',
            }}
          >
            {BUSINESS_SETUP_SERVICES.map((biz) => (
              <GlassCard key={biz.id} padding="lg" subtleGlow>
                <Badge variant="gold">{biz.tag}</Badge>
                <h2
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    marginTop: 'var(--space-3)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {biz.title}
                </h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
                  {biz.description}
                </p>

                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold-primary)', marginBottom: 'var(--space-3)' }}>
                  Core Advisory Deliverables
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                  {biz.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-gold-primary)', fontWeight: 700 }}>✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-gold-primary)', marginBottom: 'var(--space-3)' }}>
                  Procedural Milestone Steps
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  {biz.steps.map((s) => (
                    <div key={s.step} style={{ background: 'var(--surface-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{s.step}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description}</div>
                    </div>
                  ))}
                </div>

                <Button href="/contact" size="md" variant="primary" style={{ width: '100%' }}>
                  Request Consultation on {biz.title}
                </Button>
              </GlassCard>
            ))}
          </div>

          {/* Compliance & Advisory Notice */}
          <div
            className="glass-panel"
            style={{
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '860px',
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            <strong>Statutory Advisory Standard:</strong> Cityline Consultancy coordinates corporate secretarial, trade name reservations, and administrative typing. Official licenses and establishment cards are issued solely by respective UAE Economic Development and Free Zone authorities.
          </div>
        </div>
      </section>

      {/* Business Setup FAQs */}
      <section className="section" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Knowledge & FAQs"
            title={
              <>
                Business Setup <span className="text-gradient-gold">Questions.</span>
              </>
            }
            description="Clear insights into trade licensing, shareholder structuring, and operational setup in Dubai."
            align="center"
          />

          <FAQAccordion items={businessFaqs} />
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
