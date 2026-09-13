import { BusinessSetupService } from '../types/website.types';

export const BUSINESS_SETUP_SERVICES: BusinessSetupService[] = [
  {
    id: 'company-formation',
    slug: 'company-formation',
    title: 'Company Formation Advisory',
    tag: 'Commercial Advisory',
    description:
      'Strategic corporate advisory for ambitious entrepreneurs and enterprises establishing structured legal entities in the UAE.',
    highlights: [
      'Comprehensive entity structure advisory suited to your business activities',
      'Guidance on regulatory authority permissions and trade activity classifications',
      'Coordination of memorandum documentation and corporate filings',
      'Assistance with initial trade name reservations and preliminary approvals',
    ],
    steps: [
      {
        step: '1. Commercial Consultation',
        description: 'Deep dive into intended commercial activities, shareholder structure, and target market focus.',
      },
      {
        step: '2. Structure & Licensing Strategy',
        description: 'Advisory on optimal operational jurisdiction and corresponding regulatory authority frameworks.',
      },
      {
        step: '3. Name Reservation & Initial Approval',
        description: 'Filing official trade name registrations and securing regulatory preliminary permits.',
      },
      {
        step: '4. Corporate Formalities & Licensing',
        description: 'Drafting statutory agreements, lease documentation guidance, and trade license issuance support.',
      },
    ],
  },
  {
    id: 'company-setup',
    slug: 'company-setup',
    title: 'Full Company Setup Assistance',
    tag: 'Turnkey Facilitation',
    description:
      'End-to-end procedural support encompassing post-incorporation setup, identity registration, partner residency coordination, and operational enablement.',
    highlights: [
      'Complete procedural management from entity registration to active operation',
      'Investor and partner visa advisory and facilitation',
      'Establishment card and Ministry of Human Resources registration guidance',
      'Corporate governance documentation and ongoing compliance advisory',
    ],
    steps: [
      {
        step: '1. Legal Entity Execution',
        description: 'Finalization of statutory articles and issuance of the official commercial trade license.',
      },
      {
        step: '2. Immigration & Ministry Cards',
        description: 'Registration with immigration authorities and establishment of labor department files.',
      },
      {
        step: '3. Investor & Executive Residency',
        description: 'Coordinated processing of partner/investor residency visas, Emirates IDs, and medical typing.',
      },
      {
        step: '4. Operational Readiness',
        description: 'Facilitation of utility connections, office documentation, and commercial operational readiness.',
      },
    ],
  },
];
