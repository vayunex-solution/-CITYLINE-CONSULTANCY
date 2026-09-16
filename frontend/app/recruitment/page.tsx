import React from 'react';
import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RecruitmentCategories } from '@/components/recruitment/RecruitmentCategories';
import { CandidateJourney } from '@/components/recruitment/CandidateJourney';
import { EmployerJourney } from '@/components/recruitment/EmployerJourney';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { JourneyIndicator } from '@/components/hero/JourneyIndicator';

export const metadata: Metadata = {
  title: 'UAE Manpower Sourcing & Recruitment Solutions',
  description:
    'Bridging skilled Indian manpower with verified UAE corporate employers across hospitality, construction, logistics, and facility management.',
};

export default function RecruitmentPage() {
  return (
    <div style={{ paddingTop: '72px' }}>
      {/* Hero */}
      <section className="section-sm" style={{ background: 'var(--hero-mesh)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Badge variant="gold">Workforce Mobility</Badge>
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
            India → UAE <span className="text-gradient-gold">Manpower Solutions.</span>
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
            A dedicated recruitment bridge connecting skilled tradespeople, service personnel, and logistics drivers in India with reputable corporate employers across the Emirates.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
            <Button href="/jobs" size="lg" variant="primary">
              Explore Active Jobs
            </Button>
            <Button href="/employer-enquiry" size="lg" variant="glass">
              Need Manpower?
            </Button>
          </div>

          <JourneyIndicator />
        </div>
      </section>

      {/* Operational Categories */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Specialized Sectors"
            title={
              <>
                Eight High-Demand <span className="text-gradient-gold">Operational Trades.</span>
              </>
            }
            description="Our recruitment facilitation focuses on sectors critical to UAE infrastructure, hospitality, facility maintenance, and urban mobility."
            align="center"
          />

          <RecruitmentCategories />
        </div>
      </section>

      {/* Candidate Journey */}
      <section className="section" style={{ background: 'var(--surface-subtle)' }}>
        <div className="container">
          <SectionHeading
            eyebrow="For Job Seekers"
            title={
              <>
                Your path to lawful <span className="text-gradient-gold">UAE employment.</span>
              </>
            }
            description="Step-by-step guidance ensuring trade skills evaluation, interview alignment, and lawful visa mobilization."
            align="center"
          />

          <CandidateJourney />

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Button href="/jobs" size="lg" variant="primary">
              Browse Open Opportunities
            </Button>
          </div>
        </div>
      </section>

      {/* Employer Journey */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="For UAE Employers"
            title={
              <>
                Reliable, compliant <span className="text-gradient-gold">talent deployment.</span>
              </>
            }
            description="End-to-end recruitment lifecycle management from practical trade testing in India to site mobilization in the UAE."
            align="center"
          />

          <EmployerJourney />

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Button href="/employer-enquiry" size="lg" variant="primary">
              Submit Manpower Requisition
            </Button>
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
