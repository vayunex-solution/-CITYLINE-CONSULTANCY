import React from 'react';
import { ServiceCard } from './ServiceCard';

export function ServiceGrid() {
  const serviceGroups = [
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" />
        </svg>
      ),
      tag: 'Residency & Entry',
      title: 'Visa Services',
      description:
        'Structured advisory and facilitation for independent professional residency and flexible entry travel in the UAE.',
      features: [
        '2-Year Freelance Visa Dubai Assistance',
        '30-Day Visit Visa Short-Stay Entry',
        '60-Day Visit Visa Extended Exploration',
        'Document Preparation & Regulatory Review',
      ],
      ctaText: 'Explore Visa Services',
      ctaHref: '/visa-services',
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" />
        </svg>
      ),
      tag: 'Enterprise & Setup',
      title: 'Business Setup',
      description:
        'Turnkey commercial formation and post-incorporation setup support for entrepreneurs establishing a presence in the Emirates.',
      features: [
        'Company Formation Advisory',
        'Turnkey Company Setup Assistance',
        'Partner & Investor Visa Coordination',
        'Corporate Regulatory Filings Support',
      ],
      ctaText: 'Explore Business Setup',
      ctaHref: '/business-setup',
    },
    {
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      tag: 'Talent & Deployment',
      title: 'Recruitment & Manpower',
      description:
        'Connecting qualified candidates with verified UAE employers across essential operational and technical industries.',
      features: [
        '8 High-Demand Operational Categories',
        'Direct UAE Opportunity Connection',
        'Employer Bulk Manpower Sourcing',
        'Candidate Evaluation & Deployment Guidance',
      ],
      ctaText: 'Explore Recruitment',
      ctaHref: '/recruitment',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 'var(--space-8)',
      }}
    >
      {serviceGroups.map((group) => (
        <ServiceCard key={group.title} {...group} />
      ))}
    </div>
  );
}
