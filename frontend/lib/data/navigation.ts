import { NavItem } from '../types/website.types';

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: 'Services',
    href: '/visa-services',
    children: [
      {
        label: 'All Visa Services',
        href: '/visa-services',
        description: 'Explore all residency and visit visa options.',
      },
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
      {
        label: 'Business Setup in UAE',
        href: '/business-setup',
        description: '100% foreign ownership company formation & PRO.',
      },
      {
        label: 'Manpower Recruitment',
        href: '/recruitment',
        description: 'Volume manpower deployment for UAE employers.',
      },
    ],
  },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Recruitment', href: '/recruitment' },
  { label: 'Business Setup', href: '/business-setup' },
  { label: 'About Us', href: '/about' },
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
