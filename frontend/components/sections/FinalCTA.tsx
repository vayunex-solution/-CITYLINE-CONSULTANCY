import React from 'react';
import { Button } from '@/components/ui/Button';
import styles from './FinalCTA.module.css';

export function FinalCTA() {
  return (
    <section className={styles.section} aria-label="Call to Action">
      <div className="container">
        <div className={styles.box}>
          <div className={styles.glowAura} aria-hidden="true" />
          <div className={styles.content}>
            <span className={styles.eyebrow}>Take The Next Step</span>
            <h2 className={styles.title}>
              Your UAE journey starts with <span className="text-gradient-gold">a conversation.</span>
            </h2>
            <p className={styles.subtitle}>
              Whether you are an ambitious professional seeking a 2-year Freelance Visa, a company founder establishing a Dubai entity, or an employer requiring verified manpower—our advisory team is ready.
            </p>
            <div className={styles.btnGroup}>
              <Button href="/visa-enquiry" size="lg" variant="primary">
                Start Your Journey
              </Button>
              <Button href="/contact" size="lg" variant="glass">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
