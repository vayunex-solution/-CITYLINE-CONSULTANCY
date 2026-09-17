import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://citylineconsultancy.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | CITYLINE CONSULTANCY',
    default: 'CITYLINE CONSULTANCY — UAE Visas, Business Setup & Manpower Recruitment',
  },
  description:
    'Cityline Consultancy facilitates professional 2-year Freelance Visas, Visit Visas, UAE Business Setup, and Verified Manpower Recruitment connecting India and the UAE.',
  keywords: [
    'Cityline Consultancy',
    'Dubai Freelance Visa',
    '2 Year Freelance Visa Dubai',
    'UAE Business Setup',
    'Company Formation Dubai',
    'UAE Manpower Recruitment',
    'Dubai Jobs for Indians',
    'UAE Visit Visa 30 Days 60 Days',
    'Dubai Work Permit',
    'Dubai Residency Assistance',
    'Mainland Freezone Company Setup UAE',
  ],
  authors: [{ name: 'CITYLINE CONSULTANCY', url: SITE_URL }],
  creator: 'CITYLINE CONSULTANCY',
  publisher: 'CITYLINE CONSULTANCY',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CITYLINE CONSULTANCY — Gateway to UAE Opportunity',
    description:
      'Facilitating 2-year Freelance Visas, Corporate Company Formation, and Verified Manpower Recruitment across India and the United Arab Emirates.',
    url: `${SITE_URL}/`,
    siteName: 'CITYLINE CONSULTANCY',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/media/landing/hero-dubai.jpg`,
        width: 1200,
        height: 630,
        alt: 'Cityline Consultancy — UAE Visas, Business Setup & Manpower Recruitment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CITYLINE CONSULTANCY — Gateway to UAE Opportunity',
    description:
      'Facilitating 2-year Freelance Visas, Corporate Company Formation, and Verified Manpower Recruitment across India and the UAE.',
    images: [`${SITE_URL}/media/landing/hero-dubai.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060b14' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Theme Initializer */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('clc_theme');
                if (storedTheme) {
                  document.documentElement.setAttribute('data-theme', storedTheme);
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* LLM & Machine-Readable Discovery Declarations */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context Overview" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM Full Knowledge Base" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* Schema.org Global Organization & WebSite JSON-LD */}
        <OrganizationJsonLd />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AnalyticsTracker />
        <Navbar />
        <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
