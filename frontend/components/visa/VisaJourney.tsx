import React from 'react';
import { VISA_SERVICES } from '@/lib/data/visa-services';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { VisaCard } from './VisaCard';
import styles from './VisaJourney.module.css';

export function VisaJourney() {
  return (
    <section className={`section ${styles.sectionWrapper}`} id="visa-services">
      <div className="container">
        <SectionHeading
          eyebrow="Residency & Entry Pathways"
          title={
            <>
              Your route to the UAE, <span className="text-gradient-gold">made clearer.</span>
            </>
          }
          description="Transparent advisory, thorough document vetting, and procedural facilitation across 2-year independent residency and flexible entry visit visas."
          align="center"
        />

        <div className={styles.grid}>
          {VISA_SERVICES.map((service, index) => (
            <VisaCard key={service.id} service={service} featured={index === 0} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-12)' }}>
          <Button href="/visa-services" variant="secondary" size="lg">
            Explore All Visa Services
          </Button>
        </div>
      </div>
    </section>
  );
}
