import React from 'react';
import Link from 'next/link';
import { FOOTER_SECTIONS } from '@/lib/data/navigation';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <span className={styles.brandName}>CITYLINE CONSULTANCY</span>
            <p className={styles.brandDesc}>
              Your strategic partner for UAE visas, business setup advisory, and manpower recruitment solutions.
            </p>
            <div className={styles.journeyBadge}>
              <span>INDIA</span>
              <span>→</span>
              <span>JOURNEY</span>
              <span>→</span>
              <span>UAE</span>
              <span>→</span>
              <span>OPPORTUNITY</span>
            </div>
          </div>

          {/* Navigation Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className={styles.colTitle}>{section.title}</h3>
              <ul className={styles.linkList}>
                {section.links.map((link) => (
                  <li key={link.label} className={styles.linkItem}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Regulatory Disclaimer & Copyright Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.disclaimer}>
            <strong>Advisory Notice:</strong> Cityline Consultancy provides professional consulting, document preparation, and procedural facilitation. Final issuance of all visas and regulatory permits remains subject to sovereign government approvals by relevant United Arab Emirates authorities. Information on this website is for general informational purposes and does not constitute legal counsel or guarantee of outcome.
          </p>
          <p>© {currentYear} CITYLINE CONSULTANCY. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
