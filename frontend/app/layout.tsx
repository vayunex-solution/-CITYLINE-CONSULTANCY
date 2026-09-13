import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://citylineconsultancy.ae'),
  title: {
    template: '%s | CITYLINE CONSULTANCY',
    default: 'CITYLINE CONSULTANCY — UAE Visas, Business Setup & Manpower Recruitment',
  },
  description:
    'Cityline Consultancy facilitates professional 2-year Freelance Visas, Visit Visas, UAE Business Setup, and Manpower Recruitment connecting India and the UAE.',
  keywords: [
    'Cityline Consultancy',
    'Dubai Freelance Visa',
    'UAE Business Setup',
    'Company Formation Dubai',
    'UAE Manpower Recruitment',
    'Dubai Jobs',
    'UAE Visit Visa',
  ],
  authors: [{ name: 'CITYLINE CONSULTANCY' }],
  openGraph: {
    title: 'CITYLINE CONSULTANCY — Gateway to UAE Opportunity',
    description:
      'Facilitating 2-year Freelance Visas, Business Setup, and Verified Manpower Recruitment across India and the United Arab Emirates.',
    url: 'https://citylineconsultancy.ae',
    siteName: 'CITYLINE CONSULTANCY',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: false, // In accordance with project policy: No-index staging until production verification in Phase 17/18
    follow: false,
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
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
