import { FAQItem } from '../types/website.types';

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What services does Cityline Consultancy provide?',
    answer:
      'Cityline Consultancy provides structured advisory, procedural coordination, and facilitation across three core pillars: Visa Services (Freelance Visa and Visit Visas), UAE Business Setup (Company Formation and Company Setup), and Recruitment / Manpower facilitation across high-demand operational sectors.',
  },
  {
    id: 'faq-2',
    category: 'visa',
    question: 'Which visa services are facilitated by Cityline Consultancy?',
    answer:
      'We provide assistance with 2-year Freelance Visa Dubai residency facilitation, 30-day Visit Visas, and 60-day Visit Visas. Our team assists candidates with document organization, application preparation, entry permits, and in-country residency formalities.',
  },
  {
    id: 'faq-3',
    category: 'visa',
    question: 'Does Cityline Consultancy guarantee visa approval?',
    answer:
      'No consultancy can legally guarantee visa approvals. All visa decisions rest exclusively with the sovereign immigration and regulatory authorities of the United Arab Emirates. Cityline Consultancy maximizes your procedural compliance by ensuring thorough documentation and adherence to official regulations.',
  },
  {
    id: 'faq-4',
    category: 'business',
    question: 'Do you assist with UAE business setup and company formation?',
    answer:
      'Yes. We provide end-to-end strategic advisory for both Company Formation (determining corporate structure, activity licensing, name reservations) and Full Company Setup (regulatory filings, establishment cards, partner/investor residency visas).',
  },
  {
    id: 'faq-5',
    category: 'recruitment',
    question: 'What manpower recruitment sectors does Cityline Consultancy cover?',
    answer:
      'We coordinate recruitment across eight primary operational sectors: Hotel Staff, Cleaning & Facility Care, Mason, Steel Fixer, Carpenter, Bike Rider / Delivery, Taxi Driver, and Heavy Truck Driver.',
  },
  {
    id: 'faq-6',
    category: 'recruitment',
    question: 'How can employers submit their UAE manpower requirements?',
    answer:
      'UAE employers and business managers can submit their specific manpower requirements through our dedicated Employer Enquiry portal or contact our recruitment advisory team directly to discuss volume hiring, candidate trade testing, and deployment timelines.',
  },
  {
    id: 'faq-7',
    category: 'recruitment',
    question: 'How can job seekers enquire about UAE job opportunities?',
    answer:
      'Candidates can browse verified vacancies in our Jobs section, review the specific responsibilities and qualifications required, and submit an application enquiry for the role matching their skills and experience.',
  },
  {
    id: 'faq-8',
    category: 'general',
    question: 'How does the consultation and onboarding process work?',
    answer:
      'Your journey begins with an initial consultation where we assess your objectives—whether individual relocation, corporate entity formation, or manpower deployment. We outline procedural steps, document requirements, and coordinate submissions transparently throughout the process.',
  },
  {
    id: 'faq-9',
    category: 'general',
    question: 'How can I contact Cityline Consultancy?',
    answer:
      'You can reach our consultants via the Contact Us form on our website, submit a dedicated Visa or Employer Enquiry, or connect with our representatives during scheduled consultation sessions.',
  },
];

export function getFAQsByCategory(category?: 'general' | 'visa' | 'recruitment' | 'business'): FAQItem[] {
  if (!category) return FAQS;
  return FAQS.filter((item) => item.category === category);
}
