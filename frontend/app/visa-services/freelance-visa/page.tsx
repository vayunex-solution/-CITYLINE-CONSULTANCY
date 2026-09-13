import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVisaServiceBySlug, VISA_SERVICES } from '@/lib/data/visa-services';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { VisaCard } from '@/components/visa/VisaCard';

export const metadata: Metadata = {
  title: '2-Year Freelance Visa Dubai Assistance',
  description:
    'Comprehensive advisory and facilitation for 2-year Freelance Visa Dubai residency. Operate legally and independently in the UAE with structured guidance.',
};

export default function FreelanceVisaPage() {
  const service = getVisaServiceBySlug('freelance-visa');
  if (!service) notFound();

  const relatedServices = VISA_SERVICES.filter((s) => s.slug !== 'freelance-visa');

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      {/* Hero */}
      <section className="section" style={{ background: 'var(--hero-mesh)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">{service.tag}</Badge>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--text-4xl)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {service.title}
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
              marginBottom: 'var(--space-6)',
            }}
          >
            {service.description}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button href="/visa-enquiry" size="lg" variant="primary">
              {service.ctaText}
            </Button>
            <Button href="/contact" size="lg" variant="glass">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Overview & Key Highlights */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-8)',
              alignItems: 'start',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Overview & Scope
              </h2>
              {service.overview.map((para, i) => (
                <p key={i} style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                  {para}
                </p>
              ))}
            </div>

            <GlassCard padding="lg" subtleGlow>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Key Advisory Highlights
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {service.keyHighlights.map((h, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent-gold-primary)', fontWeight: 700 }}>✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Ideal For & Procedural Steps */}
      <section className="section" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
            <GlassCard padding="lg">
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Who This Visa Is Ideal For
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {service.idealFor.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-gold-primary)' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard padding="lg">
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Step-by-Step Coordination Process
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {service.processSteps.map((step) => (
                  <div key={step.title}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {step.detail}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Service FAQ */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              Frequently Asked Questions
            </h3>
            <FAQAccordion
              items={service.faqs.map((f, i) => ({
                id: `fl-faq-${i}`,
                category: 'visa',
                question: f.question,
                answer: f.answer,
              }))}
            />
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="section">
        <div className="container">
          <h3 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            Related Visa Services
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
            {relatedServices.map((rel) => (
              <VisaCard key={rel.id} service={rel} />
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
