import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './ServiceCard.module.css';

interface ServiceCardProps {
  icon: string;
  tag: string;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

export function ServiceCard({
  icon,
  tag,
  title,
  description,
  features,
  ctaText,
  ctaHref,
}: ServiceCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.headerRow}>
          <div className={styles.iconBox} aria-hidden="true">
            {icon}
          </div>
          <Badge variant="gold">{tag}</Badge>
        </div>

        <h3 className={styles.title}>
          <Link href={ctaHref} style={{ color: 'inherit', textDecoration: 'none' }}>
            {title}
          </Link>
        </h3>

        <p className={styles.desc}>{description}</p>

        <ul className={styles.featureList}>
          {features.map((item) => (
            <li key={item} className={styles.featureItem}>
              <span className={styles.featureCheck} aria-hidden="true">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bottom}>
        <Button href={ctaHref} variant="glass" size="md" style={{ width: '100%' }}>
          {ctaText}
        </Button>
      </div>
    </div>
  );
}
