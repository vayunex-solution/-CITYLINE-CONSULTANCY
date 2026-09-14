/**
 * CITYLINE CONSULTANCY — Public Website Frontend Data Models & Contracts
 * Strictly aligns with locked Phase 0-4 business scope:
 * - Visa Services: 2-year Freelance Visa, 30-day Visit Visa, 60-day Visit Visa.
 * - Business Setup: Company Formation, Company Setup.
 * - Manpower: 8 confirmed categories.
 * - Zero pricing, zero fake testimonials, zero approval guarantees.
 */

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: { label: string; href: string; description?: string }[];
}

export interface VisaServiceItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  overview: string[];
  keyHighlights: string[];
  idealFor: string[];
  processSteps: { title: string; detail: string }[];
  faqs: { question: string; answer: string }[];
  ctaText: string;
}

export interface ManpowerCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  demandFocus: string;
  iconName: string;
}

export interface BusinessSetupService {
  id: string;
  slug: string;
  title: string;
  tag: string;
  description: string;
  highlights: string[];
  steps: { step: string; description: string }[];
}

export interface JobOpportunity {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  type: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  qualification?: string;
  experienceYearsRequired?: number;
  salaryRange?: string;
  benefits?: string;
  publishedAt?: string;
  isFeatured?: boolean;
}

export interface TestimonialItem {
  id: string;
  clientName: string;
  clientRole?: string;
  location?: string;
  serviceCategory: string;
  quote: string;
  rating?: number;
  publishedAt?: string;
}

export interface FAQItem {
  id: string;
  category: 'general' | 'visa' | 'recruitment' | 'business';
  question: string;
  answer: string;
}
