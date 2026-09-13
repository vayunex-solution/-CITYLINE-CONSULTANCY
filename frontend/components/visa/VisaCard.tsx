import React from 'react';
import Link from 'next/link';
import { VisaServiceItem } from '@/lib/types/website.types';
import { Button } from '@/components/ui/Button';
import styles from './VisaJourney.module.css';

interface VisaCardProps {
  service: VisaServiceItem;
  featured?: boolean;
}

export function VisaCard({ service, featured = false }: VisaCardProps) {
  return (
    <div className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}>
      <div className={styles.top}>
        <span className={styles.durationBadge}>{service.tag}</span>
        <h3 className={styles.cardTitle}>
          <Link href={`/visa-services/${service.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {service.title}
          </Link>
        </h3>
        <p className={styles.cardDesc}>{service.description}</p>

        <ul className={styles.highlightsList}>
          {service.keyHighlights.slice(0, 3).map((item) => (
            <li key={item} className={styles.highlightItem}>
              <span className={styles.bullet} aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <Button href={`/visa-services/${service.slug}`} variant="glass" size="sm" style={{ width: '100%' }}>
          Service Details
        </Button>
        <Button href="/visa-enquiry" variant="primary" size="sm" style={{ width: '100%' }}>
          {service.ctaText}
        </Button>
      </div>
    </div>
  );
}
