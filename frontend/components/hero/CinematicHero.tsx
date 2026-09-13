'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { JourneyIndicator } from './JourneyIndicator';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
  videoSrc?: string;
  posterSrc?: string;
  eyebrow?: string;
  headline?: string;
  supportingText?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export function CinematicHero({
  videoSrc = '/media/hero/enter-dubai.mp4',
  posterSrc = '/media/hero/hero-poster.svg',
  eyebrow = 'YOUR JOURNEY. YOUR NEXT CHAPTER.',
  headline = 'ENTER DUBAI.',
  supportingText = 'From visas and business setup to careers and manpower solutions, we help you move toward the opportunities waiting in the UAE.',
  primaryCtaText = 'Start Your Journey',
  primaryCtaHref = '/visa-enquiry',
  secondaryCtaText = 'Explore Services',
  secondaryCtaHref = '#services',
}: CinematicHeroProps) {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className={styles.hero} aria-label="Hero: Enter Dubai">
      {/* Background Media Architecture */}
      <div className={styles.mediaLayer} aria-hidden="true">
        {/* Poster Fallback / Abstract Mesh Base */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt=""
          className={styles.posterFallback}
          loading="eager"
        />

        {/* Video Element (Loads gracefully without blocking page interaction) */}
        {!videoError && (
          <video
            className={styles.video}
            autoPlay
            loop
            muted
            playsInline
            poster={posterSrc}
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Ambient Overlay & Atmospheric Gradient */}
        <div className={styles.overlay} />
      </div>

      {/* Editorial Content */}
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.content}>
          <div className={styles.eyebrowBadge}>
            <span aria-hidden="true" style={{ color: 'var(--accent-gold-primary)' }}>✦</span>
            <span>{eyebrow}</span>
          </div>

          <h1 className={styles.title}>
            <span className="text-gradient-gold">{headline}</span>
          </h1>

          <p className={styles.subtitle}>{supportingText}</p>

          <div className={styles.ctaGroup}>
            <Button href={primaryCtaHref} size="lg" variant="primary">
              {primaryCtaText}
            </Button>
            <Button href={secondaryCtaHref} size="lg" variant="glass">
              {secondaryCtaText}
            </Button>
          </div>

          <div className={styles.indicatorWrapper}>
            <JourneyIndicator />
          </div>
        </div>
      </div>
    </section>
  );
}
