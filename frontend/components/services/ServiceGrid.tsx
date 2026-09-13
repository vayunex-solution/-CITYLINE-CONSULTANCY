import React from 'react';
import { ServiceCard } from './ServiceCard';

export function ServiceGrid() {
  const serviceGroups = [
    {
      icon: '🛂',
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
      icon: '🏢',
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
      icon: '👷',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-8)',
      }}
    >
      {serviceGroups.map((group) => (
        <ServiceCard key={group.title} {...group} />
      ))}
    </div>
  );
}
