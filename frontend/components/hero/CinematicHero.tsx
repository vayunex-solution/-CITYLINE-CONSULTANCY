'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
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

const HERO_JOURNEY_STEPS = [
  { num: '01', title: 'JOURNEY', desc: 'Begin your journey to the UAE' },
  { num: '02', title: 'VISA', desc: 'Hassle-free visa solutions' },
  { num: '03', title: 'WORK', desc: 'Connecting talent with opportunity' },
  { num: '04', title: 'BUSINESS', desc: 'Start, grow & succeed in UAE' },
];

export function CinematicHero({
  videoSrc = '/media/hero/enter-dubai.mp4',
  posterSrc = '/media/hero/hero-poster.svg',
  eyebrow = 'FROM INDIA TO THE UAE',
  headline = 'YOUR JOURNEY TO THE UAE STARTS HERE.',
  supportingText = 'Visa solutions, recruitment support and business setup services for individuals, entrepreneurs and businesses.',
  primaryCtaText = 'Start Your Journey',
  primaryCtaHref = '/visa-enquiry',
  secondaryCtaText = 'Explore Services',
  secondaryCtaHref = '#services',
}: CinematicHeroProps) {
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay prevented by browser power/data saver policy
        });
      }
    }
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section className={styles.hero} aria-label="Hero: Your Journey to the UAE">
      {/* Background Media Architecture */}
      <div className={styles.mediaLayer} aria-hidden="true">
        {/* Poster Fallback / Abstract Mesh Base */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt=""
          className={styles.posterFallback}
          loading="eager"
          fetchPriority="high"
        />

        {/* Video Element (Loads gracefully without blocking page interaction) */}
        {!videoError && (
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
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
          <div className={styles.heroGrid}>
            {/* Left Column: Headlines & Action */}
            <div className={styles.heroLeft}>
              <div className={styles.eyebrowBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{eyebrow}</span>
              </div>

              <h1 className={styles.title}>
                {headline.includes('STARTS HERE') ? (
                  <>
                    YOUR JOURNEY<br />
                    TO THE UAE<br />
                    <span className="text-gradient-gold">STARTS HERE.</span>
                  </>
                ) : (
                  <span className="text-gradient-gold">{headline}</span>
                )}
              </h1>

              <p className={styles.subtitle}>{supportingText}</p>

              <div className={styles.ctaGroup}>
                <Button href={primaryCtaHref} size="lg" variant="primary">
                  {primaryCtaText} →
                </Button>
                <Button href={secondaryCtaHref} size="lg" variant="glass">
                  {secondaryCtaText} →
                </Button>
              </div>

              {/* Mobile Micro Journey Strip (Sleek Glass Capsules) */}
              <div className={styles.mobileStepsStrip} aria-hidden="true">
                {HERO_JOURNEY_STEPS.map((step) => (
                  <span key={step.num} className={styles.mobileStepPill}>
                    <strong className={styles.mobileStepNum}>{step.num}</strong>
                    <span>{step.title}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: Reference-Matching Vertical Journey Card */}
            <div className={styles.heroRight}>
              <div className={styles.stepsCard}>
                {HERO_JOURNEY_STEPS.map((step) => (
                  <div key={step.num} className={styles.stepRow}>
                    <div className={styles.stepNum}>{step.num}</div>
                    <div className={styles.stepInfo}>
                      <div className={styles.stepName}>{step.title}</div>
                      <div className={styles.stepDesc}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Sound Toggle & Scroll Indicator */}
          <div className={styles.heroBottomBar}>
            <button
              type="button"
              className={styles.audioToggle}
              onClick={toggleSound}
              aria-label={isMuted ? 'Unmute background video sound' : 'Mute background video sound'}
            >
              {isMuted ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  </svg>
                  <span>Sound Off</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Sound On</span>
                </>
              )}
            </button>

            <div className={styles.scrollIndicator} aria-hidden="true">
              <span>SCROLL TO EXPLORE</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
