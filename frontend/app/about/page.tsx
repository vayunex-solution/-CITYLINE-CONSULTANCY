import React from 'react';
import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { JourneyIndicator } from '@/components/hero/JourneyIndicator';

export const metadata: Metadata = {
  title: 'About Cityline Consultancy',
  description:
    'Learn about Cityline Consultancy — your strategic advisory bridge connecting India and the UAE across visas, business formation, and manpower recruitment.',
};

export default function AboutPage() {
  const pillars = [
    {
      title: 'Visa & Residency Advisory',
      desc: 'Facilitating 2-year Freelance Visas and flexible 30/60-day Visit Visas with meticulous procedural coordination.',
    },
    {
      title: 'UAE Business Setup',
      desc: 'Guiding entrepreneurs through Company Formation, regulatory classifications, and turnkey commercial setup in the Emirates.',
    },
    {
      title: 'Recruitment & Manpower',
      desc: 'Bridging skilled Indian operational trades with verified UAE employer sponsors across hospitality, logistics, and construction.',
    },
  ];

  const values = [
    {
      title: 'Integrity & Fact-Based Guidance',
      desc: 'We never issue false guarantees or unrealistic promises. Every recommendation is grounded in current UAE regulatory frameworks.',
    },
    {
      title: 'End-to-End Procedural Vetting',
      desc: 'From initial trade credentials in India to Emirates ID processing in Dubai, we ensure rigorous documentation standards.',
    },
    {
      title: 'Human-Centered Mobility',
      desc: 'We understand that moving to the UAE represents a transformative life milestone. We treat every applicant with dignity and focus.',
    },
  ];

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">About Cityline</Badge>
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
            A Purposeful Bridge to <span className="text-gradient-gold">UAE Opportunity.</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
              marginBottom: 'var(--space-8)',
            }}
          >
            Cityline Consultancy operates as a dedicated advisory and facilitation consultancy, connecting ambition in India with real, lawful economic potential across the United Arab Emirates.
          </p>
          <JourneyIndicator />
        </div>
      </section>

      {/* Who We Are & What We Help With */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-8)',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--accent-gold-primary)',
                }}
              >
                Who We Are
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  marginTop: 'var(--space-2)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Guiding career mobility and corporate establishment.
              </h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                Founded to bring clarity to cross-border journeys, Cityline Consultancy provides strategic advisory to individuals and corporate entities. Whether you are an independent consultant pursuing UAE residency, an entrepreneur seeking to incorporate in Dubai, or an enterprise sourcing operational talent, we streamline the process with thorough compliance.
              </p>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                We do not position the UAE merely as a travel destination—we position it as an international platform for professional advancement, capital formation, and long-term career stability.
              </p>
            </div>

            <GlassCard padding="lg" subtleGlow>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Core Advisory Pillars
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {pillars.map((p) => (
                  <div key={p.title} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
                    <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                      {p.title}
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Values & Approach */}
      <section className="section" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Our Working Philosophy"
            title={
              <>
                Principles that govern <span className="text-gradient-gold">every engagement.</span>
              </>
            }
            description="Our focus is procedural excellence, regulatory compliance, and transparent advisory standards."
            align="center"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {values.map((v) => (
              <GlassCard key={v.title} padding="lg">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {v.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
