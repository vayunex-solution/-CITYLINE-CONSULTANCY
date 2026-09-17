import React from 'react';
import { fetchPublishedTestimonials } from '@/lib/data/testimonials';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { TestimonialCard } from './TestimonialCard';

export async function TestimonialsSection() {
  const testimonials = await fetchPublishedTestimonials();

  return (
    <section className="section" id="testimonials">
      <div className="container">
        <SectionHeading
          eyebrow="Client Experiences"
          title={
            <>
              Stories from our <span className="text-gradient-gold">UAE Community.</span>
            </>
          }
          description="Verified experiences from individuals and business founders who navigated their UAE visa, career, and business setup journeys with Cityline Consultancy."
          align="center"
        />

        {testimonials.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        ) : (
          /* Graceful Empty-State Architecture (Strictly adheres to: No fake testimonials) */
          <div
            className="glass-panel"
            style={{
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Real Stories. Authentic Milestones.
            </h3>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                lineHeight: 1.65,
                maxWidth: '560px',
              }}
            >
              Cityline Consultancy upholds a strict transparency standard: we feature only client-verified, approved milestone accounts. Formal reviews from our ongoing visa and recruitment deployments are cataloged as clients complete their UAE onboarding.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
              <Button href="/visa-enquiry" size="md" variant="primary">
                Start Your Journey
              </Button>
              <Button href="/contact" size="md" variant="glass">
                Share Your Experience
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
