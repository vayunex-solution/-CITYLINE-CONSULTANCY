import { VisaServiceItem } from '../types/website.types';

export const VISA_SERVICES: VisaServiceItem[] = [
  {
    id: 'freelance-visa',
    slug: 'freelance-visa',
    title: '2-Year Freelance Visa Dubai Assistance',
    subtitle: 'Independent Professional Residency in the UAE',
    tag: 'Long-Term Opportunity',
    description:
      'Comprehensive facilitation and advisory support for professionals and specialists seeking 2-year independent residency to work, live, and operate across the UAE.',
    overview: [
      'The 2-year Freelance Visa provides qualified individuals with residency privileges to conduct professional activities legally across the Emirates.',
      'Cityline Consultancy advises and coordinates the complete document preparation, identity registration, medical typing, and residency issuance workflow.',
      'Every case is assessed individually to match your professional background with valid UAE regulatory pathways.',
    ],
    keyHighlights: [
      '2-Year renewable UAE residency facilitation',
      'Step-by-step document coordination and guidance',
      'Emirates ID registration and medical typing advisory',
      'Freedom to reside and operate professionally across the UAE',
      'Dedicated case manager support from India to UAE arrival',
    ],
    idealFor: [
      'Skilled professionals seeking independent UAE residency',
      'Remote consultants and technical specialists',
      'Experienced tradespeople and independent operators',
      'Individuals looking for stability and long-term career growth in Dubai',
    ],
    processSteps: [
      {
        title: '1. Initial Profile Review',
        detail: 'Comprehensive evaluation of your professional background, passport validity, and eligibility parameters.',
      },
      {
        title: '2. Documentation Preparation',
        detail: 'Preparation, attestation guidance, and structured submission of verified credentials.',
      },
      {
        title: '3. Entry Permit Facilitation',
        detail: 'Coordination of the initial UAE entry permit to allow lawful arrival in the Emirates.',
      },
      {
        title: '4. In-Country Formalities',
        detail: 'Guided completion of medical fitness examination, Emirates ID biometrics, and residency stamping.',
      },
    ],
    faqs: [
      {
        question: 'What is the duration of the Freelance Visa assistance?',
        answer:
          'We facilitate 2-year renewable freelance residency pathways in the UAE. Exact eligibility and requirements depend on current regulatory guidelines and profile evaluation.',
      },
      {
        question: 'Can I sponsor family members under a 2-year freelance residency?',
        answer:
          'Subject to meeting UAE residency and income criteria, freelance visa holders can sponsor family members. Our consultants provide tailored guidance based on individual circumstances.',
      },
      {
        question: 'Does Cityline Consultancy guarantee visa approval?',
        answer:
          'No. All visa issuances are subject to sovereign UAE government authority approvals. Cityline Consultancy provides professional advisory, document review, and end-to-end procedural support to maximize compliance and accuracy.',
      },
    ],
    ctaText: 'Enquire About Freelance Visa',
  },
  {
    id: 'visit-visa-30-days',
    slug: 'visit-visa-30-days',
    title: '30-Day Visit Visa Assistance',
    subtitle: 'Short-Stay Entry & Exploration Visa',
    tag: 'Short-Stay Entry',
    description:
      'Fast, structured application assistance for individuals visiting the UAE for business exploration, family visits, or short-term travel.',
    overview: [
      'The 30-Day Visit Visa allows travelers and career explorers to enter the UAE lawfully for short-term visits, networking, and exploratory meetings.',
      'Our team coordinates all application formalities, passport validity checks, and document verification to ensure timely processing.',
    ],
    keyHighlights: [
      'Single-entry 30-day stay assistance',
      'Rapid document validation and submission',
      'Strict adherence to UAE immigration entry standards',
      'Consultant support for itinerary and onward travel guidance',
    ],
    idealFor: [
      'Professionals exploring employment opportunities in Dubai',
      'Entrepreneurs conducting exploratory market research and meetings',
      'Short-term family visits and professional events',
    ],
    processSteps: [
      {
        title: '1. Document Verification',
        detail: 'Submission of clear passport copy with 6+ months validity, photograph, and contact details.',
      },
      {
        title: '2. Application Submission',
        detail: 'Verification and submission through approved UAE immigration portals.',
      },
      {
        title: '3. Electronic Visa Delivery',
        detail: 'Secure electronic transmission of your approved eVisa prior to departure.',
      },
    ],
    faqs: [
      {
        question: 'Can a 30-day visit visa be extended?',
        answer:
          'In-country extensions are subject to prevailing UAE immigration policies at the time of renewal. Our team can advise on extension or status-change options prior to expiry.',
      },
      {
        question: 'What passport validity is required?',
        answer:
          'A minimum of 6 months passport validity from the intended date of entry into the UAE is mandatory.',
      },
    ],
    ctaText: 'Enquire for 30-Day Visa',
  },
  {
    id: 'visit-visa-60-days',
    slug: 'visit-visa-60-days',
    title: '60-Day Visit Visa Assistance',
    subtitle: 'Extended-Stay Travel & Opportunity Search',
    tag: 'Extended Opportunity',
    description:
      'Ideal for extended opportunity evaluation, job search interviews, commercial networking, and thorough exploration of life and business in the Emirates.',
    overview: [
      'The 60-Day Visit Visa provides a generous two-month window to explore career avenues, attend in-person interviews, inspect business setup locations, and establish professional contacts in the UAE.',
      'Cityline Consultancy facilitates all administrative requirements, ensuring complete compliance with UAE entry regulations.',
    ],
    keyHighlights: [
      '60-day continuous stay allowance',
      'Sufficient time for in-person interviews and business networking',
      'Full consultation on visa status change if employment or business is secured',
      'Transparent procedural guidance throughout your stay',
    ],
    idealFor: [
      'Job seekers conducting comprehensive in-person interviews in Dubai',
      'Business founders conducting extensive supplier and partner evaluations',
      'Individuals assessing long-term relocation to the UAE',
    ],
    processSteps: [
      {
        title: '1. Requirements Consultation',
        detail: 'Clear review of required identification, photographs, and confirmed travel intentions.',
      },
      {
        title: '2. Portal Submission',
        detail: 'Accurate entry into UAE immigration systems to prevent procedural delays.',
      },
      {
        title: '3. Visa Issuance & Briefing',
        detail: 'Issuance of eVisa and comprehensive pre-travel advisory regarding entry protocols.',
      },
    ],
    faqs: [
      {
        question: 'Is 60 days sufficient to search for a job in the UAE?',
        answer:
          'Yes, many professionals find 60 days to be an optimal timeframe for scheduling in-person interviews, attending company assessments, and finalizing preliminary offers.',
      },
      {
        question: 'Can I convert my 60-day visit visa to an employment or freelance visa?',
        answer:
          'Yes. Once you secure an employment contract or obtain freelance residency approval, an in-country status change can be processed without leaving the UAE, subject to regulatory approvals.',
      },
    ],
    ctaText: 'Enquire for 60-Day Visa',
  },
];

export function getVisaServiceBySlug(slug: string): VisaServiceItem | undefined {
  return VISA_SERVICES.find((service) => service.slug === slug);
}
