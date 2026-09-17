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

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { BreadcrumbJsonLd, ServiceJsonLd, FaqJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: '30-Day Visit Visa UAE Assistance',
  description:
    'Structured application assistance for short-stay 30-day UAE visit visas. Transparent documentation review and entry coordination by Cityline Consultancy.',
  alternates: {
    canonical: '/visa-services/visit-visa-30-days/',
  },
  openGraph: {
    title: '30-Day Visit Visa UAE Assistance | Cityline Consultancy',
    description:
      'Structured application assistance for short-stay 30-day UAE visit visas. Fast document vetting and entry coordination.',
    url: '/visa-services/visit-visa-30-days/',
  },
};

export default function VisitVisa30DaysPage() {
  const service = getVisaServiceBySlug('visit-visa-30-days');
  if (!service) notFound();

  const relatedServices = VISA_SERVICES.filter((s) => s.slug !== 'visit-visa-30-days');

  return (
    <div className="page-wrapper">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Visa Services', url: '/visa-services/' },
          { name: '30-Day Visit Visa', url: '/visa-services/visit-visa-30-days/' },
        ]}
      />
      <ServiceJsonLd
        name="30-Day Visit Visa UAE Assistance"
        description={service.description}
        serviceType="Travel & Visit Visa Facilitation"
        url="/visa-services/visit-visa-30-days/"
      />
      <FaqJsonLd faqs={service.faqs} />
      {/* Hero */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'left' }}>
            <Breadcrumb
              items={[
                { label: 'Visa Services', href: '/visa-services' },
                { label: '30-Day Visit Visa' },
              ]}
            />
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge variant="gold">{service.tag}</Badge>
              <Badge variant="slate">Short-Term Tourism & Visits</Badge>
              <Badge variant="outline">Fast Document Vetting</Badge>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
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
                fontSize: 'var(--text-base)',
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
              <a
                href="https://wa.me/971501234567?text=Hello%20Cityline,%20I%20am%20inquiring%20about%20the%2030-Day%20UAE%20Visit%20Visa."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.8rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#25d366',
                  color: '#0b1e13',
                  fontWeight: 700,
                  fontSize: 'var(--text-base)',
                  textDecoration: 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>WhatsApp Enquiry</span>
              </a>
              <Button href="/contact" size="lg" variant="glass">
                Speak with an Advisor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Overview & Highlights */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--space-8)',
              alignItems: 'start',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Overview & Purpose
              </h2>
              {service.overview.map((para, i) => (
                <p key={i} style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                  {para}
                </p>
              ))}
            </div>

            <GlassCard padding="lg" subtleGlow>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Service Inclusions
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

      {/* Process & FAQ */}
      <section className="section" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
            <GlassCard padding="lg">
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                Target Applicants
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
                Facilitation Flow
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

          <div>
            <h3 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              Visit Visa FAQs
            </h3>
            <FAQAccordion
              items={service.faqs.map((f, i) => ({
                id: `v30-faq-${i}`,
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
            Alternative Visa Options
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-6)' }}>
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
