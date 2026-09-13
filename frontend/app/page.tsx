import React from 'react';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ServiceGrid } from '@/components/services/ServiceGrid';
import { VisaJourney } from '@/components/visa/VisaJourney';
import { RecruitmentCategories } from '@/components/recruitment/RecruitmentCategories';
import { BUSINESS_SETUP_SERVICES } from '@/lib/data/business-setup';
import { JobList } from '@/components/jobs/JobList';
import { WhyCityline } from '@/components/sections/WhyCityline';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { getFAQsByCategory } from '@/lib/data/faq';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  const previewFaqs = getFAQsByCategory('general').slice(0, 5);

  return (
    <>
      {/* 1. Cinematic Hero */}
      <CinematicHero />

      {/* 2. Trust / Positioning Strip */}
      <TrustStrip />

      {/* 3. "Your Journey Starts Here" Introduction */}
      <section className="section" id="journey-intro">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--space-10)',
              alignItems: 'center',
            }}
          >
            <div style={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold-primary)',
                  display: 'block',
                  marginBottom: 'var(--space-2)',
                }}
              >
                India → UAE Career & Enterprise Bridge
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Connecting ambition with <span className="text-gradient-gold">UAE opportunity.</span>
              </h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                The United Arab Emirates represents one of the world’s most dynamic hubs for professional growth, enterprise establishment, and skilled careers. Cityline Consultancy bridges the path between India and the UAE by providing reliable procedural advisory, structured documentation, and lawful facilitation across independent residency, business incorporation, and essential manpower sectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Services Overview */}
      <section className="section" id="services" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Core Competencies"
            title={
              <>
                Integrated solutions for <span className="text-gradient-gold">every milestone.</span>
              </>
            }
            description="Whether launching an independent career in Dubai, forming an enterprise, or securing verified manpower, explore our specialized service divisions."
            align="center"
          />

          <ServiceGrid />
        </div>
      </section>

      {/* 5. Visa Journey Section */}
      <VisaJourney />

      {/* 6. Recruitment & Manpower Section */}
      <section className="section" id="recruitment">
        <div className="container">
          <SectionHeading
            eyebrow="Workforce & Employment"
            title={
              <>
                Operational manpower, <span className="text-gradient-gold">professionally deployed.</span>
              </>
            }
            description="Facilitating lawful, skills-verified employment across eight essential operational and technical trades connecting candidates with vetted UAE employers."
            align="center"
          />

          <RecruitmentCategories />

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
              marginTop: 'var(--space-10)',
            }}
          >
            <Button href="/jobs" size="lg" variant="primary">
              Explore Active Jobs
            </Button>
            <Button href="/employer-enquiry" size="lg" variant="glass">
              Need Manpower?
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Business Setup Section */}
      <section className="section" id="business-setup" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Enterprise Formation"
            title={
              <>
                Launch your business in the <span className="text-gradient-gold">Emirates.</span>
              </>
            }
            description="Structured advisory for commercial trade licensing, statutory filings, establishment cards, and investor residency coordination."
            align="center"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {BUSINESS_SETUP_SERVICES.map((biz) => (
              <GlassCard key={biz.id} padding="lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Badge variant="gold">{biz.tag}</Badge>
                    <h3
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: 'var(--text-xl)',
                        fontWeight: 700,
                        marginTop: 'var(--space-3)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      {biz.title}
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                      {biz.description}
                    </p>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {biz.highlights.map((h, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent-gold-primary)', fontWeight: 700 }}>•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                    <Button href="/business-setup" variant="glass" size="md" style={{ width: '100%' }}>
                      Explore {biz.title}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 8. UAE Opportunity / Journey Section */}
      <section className="section" id="uae-opportunity">
        <div className="container">
          <div
            className="glass-panel"
            style={{
              padding: 'var(--space-12) var(--space-8)',
              borderRadius: 'var(--radius-2xl)',
              background: 'radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 60%), var(--surface-card)',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
              <Badge variant="gold">A Destination for Excellence</Badge>
              <h2
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  marginTop: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Dubai as a career & business destination.
              </h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
                The UAE represents more than a modern skyline—it is an internationally recognized ecosystem of economic stability, forward-thinking regulatory infrastructure, and merit-based career mobility. From technical trades to corporate enterprises, individuals choose the Emirates for competitive compensation, world-class living standards, and new beginnings.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Button href="/about" size="md" variant="primary">
                  Learn About Cityline
                </Button>
                <Button href="/visa-enquiry" size="md" variant="glass">
                  Begin Your Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Jobs Preview Section */}
      <section className="section" id="jobs-preview" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Active Vacancies"
            title={
              <>
                Current opportunities <span className="text-gradient-gold">in the UAE.</span>
              </>
            }
            description="Explore representative vacancies across verified hospitality, trade, and logistics employers in Dubai and the Northern Emirates."
            align="center"
          />

          <JobList limit={4} showFilters={false} />

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Button href="/jobs" size="lg" variant="secondary">
              View All Opportunities
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Why Cityline */}
      <WhyCityline />

      {/* 11. Testimonials */}
      <TestimonialsSection />

      {/* 12. FAQ Preview */}
      <section className="section" id="faq-preview" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="Clarity & Answers"
            title={
              <>
                Frequently Asked <span className="text-gradient-gold">Questions.</span>
              </>
            }
            description="Essential guidance regarding our advisory scope, visa facilitation standards, and recruitment protocols."
            align="center"
          />

          <FAQAccordion items={previewFaqs} />

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Button href="/faq" size="md" variant="glass">
              Browse Complete Knowledge Base
            </Button>
          </div>
        </div>
      </section>

      {/* 13. Final Call to Action */}
      <FinalCTA />
    </>
  );
}
