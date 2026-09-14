import React from 'react';
import type { Metadata } from 'next';
import { fetchPublishedTestimonials } from '@/lib/data/testimonials';
import { TestimonialCard } from '@/components/testimonials/TestimonialCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata: Metadata = {
  title: 'Client Experiences & Testimonials',
  description:
    'Verified client milestone accounts and experiences with Cityline Consultancy across visas, business incorporation, and UAE career mobility.',
};

export default async function TestimonialsPage() {
  const testimonials = await fetchPublishedTestimonials();

  return (
    <div style={{ paddingTop: 'var(--space-20)' }}>
      {/* Hero */}
      <section className="section" style={{ background: 'var(--hero-mesh)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">Milestone Accounts</Badge>
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
            Client Experiences & <span className="text-gradient-gold">Milestones.</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
          >
            Real feedback from individuals and organizations navigating cross-border career advancement, residency facilitation, and enterprise formation with Cityline Consultancy.
          </p>
        </div>
      </section>

      {/* Testimonials List or Graceful Empty State */}
      <section className="section">
        <div className="container">
          {testimonials.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: 'var(--space-16) var(--space-8)',
                textAlign: 'center',
                maxWidth: '800px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
              }}
            >
              <span style={{ fontSize: '3rem' }} aria-hidden="true">🌟</span>
              <h2
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                Committed to Authenticity
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  maxWidth: '560px',
                }}
              >
                In strict accordance with our transparency charter, Cityline Consultancy publishes only verified, client-consented reviews. Formal milestone accounts will be cataloged here following our ongoing candidate arrivals and corporate incorporations.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-4)' }}>
                <Button href="/visa-enquiry" size="md" variant="primary">
                  Start Your Journey
                </Button>
                <Button href="/contact" size="md" variant="glass">
                  Contact Our Consultants
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
