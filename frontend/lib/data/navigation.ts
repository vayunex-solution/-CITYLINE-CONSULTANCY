import { NavItem } from '../types/website.types';

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Visa Services',
    href: '/visa-services',
    children: [
      {
        label: '2-Year Freelance Visa',
        href: '/visa-services/freelance-visa',
        description: 'Independent UAE residency facilitation & coordination.',
      },
      {
        label: '30-Day Visit Visa',
        href: '/visa-services/visit-visa-30-days',
        description: 'Short-term entry for travel and exploration.',
      },
      {
        label: '60-Day Visit Visa',
        href: '/visa-services/visit-visa-60-days',
        description: 'Extended stay for career and business exploration.',
      },
    ],
  },
  { label: 'Recruitment', href: '/recruitment' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Business Setup', href: '/business-setup' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_SECTIONS = [
  {
    title: 'Services',
    links: [
      { label: '2-Year Freelance Visa', href: '/visa-services/freelance-visa' },
      { label: '30-Day Visit Visa', href: '/visa-services/visit-visa-30-days' },
      { label: '60-Day Visit Visa', href: '/visa-services/visit-visa-60-days' },
      { label: 'Company Formation', href: '/business-setup' },
      { label: 'Company Setup', href: '/business-setup' },
    ],
  },
  {
    title: 'Opportunities',
    links: [
      { label: 'Explore Jobs', href: '/jobs' },
      { label: 'Recruitment Solutions', href: '/recruitment' },
      { label: 'Employer Manpower Enquiry', href: '/employer-enquiry' },
      { label: 'Visa Enquiry', href: '/visa-enquiry' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Cityline', href: '/about' },
      { label: 'Why Cityline', href: '/#why-cityline' },
      { label: 'Testimonials', href: '/testimonials' },
      { label: 'Frequently Asked Questions', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];
