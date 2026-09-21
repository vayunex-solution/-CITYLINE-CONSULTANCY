import React from 'react';

/**
 * CITYLINE CONSULTANCY — Semantic Structured Data (Schema.org / JSON-LD)
 * Provides machine-readable entity schemas for Search Engines (Google, Bing)
 * and Generative AI Engines (ChatGPT, Perplexity, Gemini, Claude, SearchGPT).
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://citylineconsultancy.com';

/**
 * Organization & LocalBusiness / ProfessionalService Schema
 * Establishes company authority, official identity, service categories, and physical/geo footprint.
 */
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'ProfessionalService', 'EmploymentAgency'],
        '@id': `${BASE_URL}/#organization`,
        name: 'Cityline Consultancy',
        legalName: 'Cityline Consultancy',
        alternateName: 'CLC',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo-with-bg.png`,
          caption: 'Cityline Consultancy Logo',
        },
        image: `${BASE_URL}/logo-with-bg.png`,
        description:
          'Strategic facilitation and advisory firm connecting Indian talent, professionals, and entrepreneurs with UAE residency visas, business setup, and manpower recruitment solutions.',
        email: 'info@citylineconsultancy.com',
        telephone: '+971-50-123-4567',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai',
          addressRegion: 'Dubai',
          addressCountry: 'AE',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '25.2048',
          longitude: '55.2708',
        },
        areaServed: [
          {
            '@type': 'Country',
            name: 'United Arab Emirates',
          },
          {
            '@type': 'Country',
            name: 'India',
          },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Cityline Consultancy Core Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: '2-Year Freelance Visa Dubai Assistance',
                description:
                  'Complete facilitation for 2-year independent UAE residency, Emirates ID, and medical typing.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'UAE Visit Visa Facilitation (30-Day & 60-Day)',
                description:
                  'Structured entry permit processing for tourism, business visits, and opportunity evaluation.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'UAE Business Setup & Company Formation Advisory',
                description:
                  'End-to-end corporate formation, trade licensing (Mainland & Freezone), and investor visa coordination.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Cross-Border Manpower Recruitment (India to UAE)',
                description:
                  'Volume talent sourcing, trade-testing, and compliance deployment for UAE employers.',
              },
            },
          ],
        },
        sameAs: [
          'https://www.linkedin.com/company/citylineconsultancy',
          'https://www.facebook.com/citylineconsultancy',
          'https://www.instagram.com/citylineconsultancy',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'Cityline Consultancy',
        description: 'Gateway to UAE Visas, Business Setup & Manpower Recruitment',
        publisher: {
          '@id': `${BASE_URL}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/jobs?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList Schema
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQPage Schema
 */
export function FaqJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Service Schema
 */
export function ServiceJsonLd({
  name,
  description,
  serviceType,
  url,
  providerName = 'Cityline Consultancy',
}: {
  name: string;
  description: string;
  serviceType: string;
  url: string;
  providerName?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    provider: {
      '@type': 'Organization',
      name: providerName,
      url: BASE_URL,
    },
    areaServed: [
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Country', name: 'India' },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JobPosting Schema
 */
export function JobPostingJsonLd({
  title,
  description,
  slug,
  datePosted = '2026-09-01T00:00:00Z',
  validThrough = '2026-12-31T23:59:59Z',
  employmentType = 'FULL_TIME',
  location = 'Dubai, United Arab Emirates',
  hiringOrganization = 'Cityline Consultancy Client Partner',
  currency = 'AED',
  salaryRange,
}: {
  title: string;
  description: string;
  slug: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string;
  location?: string;
  hiringOrganization?: string;
  currency?: string;
  salaryRange?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Cityline Consultancy',
      value: slug,
    },
    datePosted,
    validThrough,
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganization,
      sameAs: BASE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location.split(',')[0].trim(),
        addressCountry: 'AE',
      },
    },
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'India',
    },
    directApply: true,
    url: `${BASE_URL}/jobs/${slug}/`,
  };

  if (salaryRange) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency,
      value: {
        '@type': 'QuantitativeValue',
        value: salaryRange,
        unitText: 'MONTH',
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
