import React from 'react';
import type { Metadata } from 'next';
import { VISA_SERVICES } from '@/lib/data/visa-services';
import { VisaCard } from '@/components/visa/VisaCard';
import { Badge } from '@/components/ui/Badge';
import { FinalCTA } from '@/components/sections/FinalCTA';

import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'UAE Visa Services & Residency Advisory',
  description:
    'Explore 2-year Freelance Visa Dubai assistance and 30/60-day Visit Visas facilitated by Cityline Consultancy with transparent procedural guidance.',
};

export default function VisaServicesPage() {
  return (
    <div style={{ paddingTop: '72px' }}>
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <Breadcrumb items={[{ label: 'Visa Services' }]} />
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge variant="gold">Residency & Entry</Badge>
              <Badge variant="slate">Official Procedural Support</Badge>
              <Badge variant="outline">Dubai & Northern Emirates</Badge>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              UAE Visa Services & <span className="text-gradient-gold">Residency Advisory.</span>
            </h1>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-secondary)',
                maxWidth: '720px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.7,
              }}
            >
              Structured procedural support for skilled independent professionals seeking long-term 2-year Dubai residency, as well as flexible entry visit visas for exploratory and travel purposes.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-12)',
            }}
          >
            {VISA_SERVICES.map((service, index) => (
              <VisaCard key={service.id} service={service} featured={index === 0} />
            ))}
          </div>

          {/* Regulatory Disclaimer Notice */}
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
            <strong>Regulatory Consultation Notice:</strong> Cityline Consultancy provides document organization, typing guidance, and procedural liaison. Requirements, eligibility rules, and approval determinations are exercised exclusively by relevant UAE immigration and government authorities. Consultation is required to review individual profile applicability.
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
