import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { HeroBridge } from '@/components/sections/HeroBridge';
import { JobList } from '@/components/jobs/JobList';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { getFAQsByCategory } from '@/lib/data/faq';
import { Button } from '@/components/ui/Button';
import { InlineManpowerForm } from '@/components/forms/InlineManpowerForm';
import styles from './HomePageStyles.module.css';

/* ── SVG Icon primitives (no emojis) ── */
const IconVisa = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const IconJobs = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconManpower = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBusiness = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);


const SERVICES = [
  {
    Icon: IconVisa,
    title: 'Visa',
    subtitle: 'Fast, reliable & hassle-free visa solutions.',
    href: '/visa-services',
    cta: 'Explore Visa',
  },
  {
    Icon: IconJobs,
    title: 'Jobs',
    subtitle: 'Find the right job opportunities in UAE.',
    href: '/jobs',
    cta: 'Explore Jobs',
  },
  {
    Icon: IconManpower,
    title: 'Manpower',
    subtitle: 'Hire skilled & reliable manpower for your business.',
    href: '/recruitment',
    cta: 'Explore Manpower',
  },
  {
    Icon: IconBusiness,
    title: 'Business',
    subtitle: 'Start & grow your business in the UAE with confidence.',
    href: '/business-setup',
    cta: 'Explore Business',
  },
];

const VISA_TYPES = [
  {
    tag: '2 YEAR',
    title: 'Freelance Visa',
    desc: 'Live, work, and grow independently in UAE',
  },
  {
    tag: '30 DAY',
    title: 'Visit Visa',
    desc: 'Short stay for business or leisure',
  },
  {
    tag: '60 DAY',
    title: 'Visit Visa',
    desc: 'Extended stay with flexible options',
  },
];

const RECRUITMENT_STEPS = [
  { num: '01', title: 'Source', desc: 'We source quality candidates from India' },
  { num: '02', title: 'Screen', desc: 'Skills assessment & background verification' },
  { num: '03', title: 'Select', desc: 'Shortlisting the best talent for you' },
  { num: '04', title: 'Deploy', desc: 'Smooth appointments to UAE employer' },
];

const BUSINESS_SERVICES = [
  {
    Icon: IconBusiness,
    title: 'Company Formation',
    desc: '100% ownership & full compliance',
    items: ['Trade License', 'Mainland & Freezone', 'Legal Structuring'],
  },
  {
    Icon: IconManpower,
    title: 'Company Setup',
    desc: 'Hassle-free setup with expert support',
    items: ['Bank Account Opening', 'PRO Services', 'Office Solutions'],
  },
  {
    Icon: IconVisa,
    title: 'Business Support',
    desc: 'Ongoing support for your business growth',
    items: ['Investor Visa', 'Renewal & Amendments', 'Advisory'],
  },
];

const WHY_ITEMS = [
  {
    Icon: IconCheck,
    title: 'Verified Candidates',
    desc: 'Every candidate is background-checked',
  },
  {
    Icon: IconCheck,
    title: 'Fast Deployment',
    desc: 'Rapid mobilization to UAE employers',
  },
  {
    Icon: IconCheck,
    title: 'Flexible Workforce',
    desc: 'Full-time, part-time, contract hiring',
  },
  {
    Icon: IconCheck,
    title: 'End-to-End Support',
    desc: 'From sourcing to onboarding in UAE',
  },
];

export default function HomePage() {
  const previewFaqs = getFAQsByCategory('general').slice(0, 5);

  return (
    <>
      {/* ═══════════════════════════════
          1. CINEMATIC HERO (video-ready)
      ═══════════════════════════════ */}
      <CinematicHero
        posterSrc="/media/landing/hero-dubai.jpg"
        eyebrow="FROM INDIA TO THE UAE"
        headline="YOUR JOURNEY TO THE UAE STARTS HERE."
        supportingText="Visa solutions, recruitment support and business setup services for individuals, entrepreneurs and businesses."
        primaryCtaText="Start Your Journey"
        primaryCtaHref="/visa-enquiry"
        secondaryCtaText="Explore Services"
        secondaryCtaHref="#services"
      />

      {/* ═══════════════════════════════
          2. INDIA → CITYLINE → UAE BRIDGE
      ═══════════════════════════════ */}
      <div className="container">
        <HeroBridge />
      </div>

      {/* ═══════════════════════════════
          3. WHAT BRINGS YOU TO UAE — Services
      ═══════════════════════════════ */}
      <section id="services" className={styles.servicesSection}>
        <div className="container">
          <div className={styles.eyebrow}>WHAT BRINGS YOU TO UAE?</div>
          <h2 className={styles.sectionTitle}>
            We Have the <span className="text-gradient-gold">Right Solution for You</span>
          </h2>
          <div className={styles.servicesGrid}>
            {SERVICES.map(({ Icon, title, subtitle, href, cta }) => (
              <Link key={title} href={href} className={styles.serviceCard}>
                <div className={styles.serviceIconWrap}>
                  <Icon />
                </div>
                <h3 className={styles.serviceCardTitle}>{title}</h3>
                <p className={styles.serviceCardDesc}>{subtitle}</p>
                <span className={styles.serviceCardCta}>
                  {cta} <IconArrow />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          4. VISA SOLUTIONS
      ═══════════════════════════════ */}
      <section id="visa-solutions" className={styles.visaSection}>
        <div className="container">
          <div className={styles.visaLayout}>
            <div className={styles.visaImageCol}>
              <div className={styles.visaImageWrap}>
                <Image
                  src="/media/landing/visa-passport.jpg"
                  alt="UAE Passport with visa stamps and Dubai skyline"
                  fill
                  className={styles.visaImage}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className={styles.visaImageOverlay} />
              </div>
            </div>
            <div className={styles.visaContent}>
              <div className={styles.eyebrow}>VISA SOLUTIONS</div>
              <h2 className={styles.visaHeadline}>
                Simple.<br />Transparent.<br />
                <span className="text-gradient-gold">Hassle-Free.</span>
              </h2>
              <p className={styles.visaDesc}>Choose the visa that fits your needs.</p>
              <div className={styles.visaTypes}>
                {VISA_TYPES.map((v) => (
                  <Link key={v.title + v.tag} href="/visa-services" className={styles.visaTypeRow}>
                    <div>
                      <span className={styles.visaTag}>{v.tag}</span>
                      <span className={styles.visaTypeName}>{v.title}</span>
                    </div>
                    <span className={styles.visaTypeDesc}>{v.desc}</span>
                    <IconArrow />
                  </Link>
                ))}
              </div>
              <div className={styles.visaCtas}>
                <Button href="/visa-enquiry" variant="primary" size="md">Start Enquiry</Button>
                <Button href="/visa-services" variant="glass" size="md">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          5. JOBS — Real API Data
      ═══════════════════════════════ */}
      <section id="jobs-preview" className={styles.jobsSection}>
        <div className="container">
          <div className={styles.eyebrow}>JOBS &amp; OPPORTUNITIES</div>
          <h2 className={styles.sectionTitle}>
            Find Your <span className="text-gradient-gold">Next Opportunity</span>
          </h2>
          {/* JobList fetches real jobs from backend */}
          <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
            <JobList limit={6} showFilters={true} />
          </Suspense>
          <div className={styles.centeredCta}>
            <Button href="/jobs" variant="glass" size="lg">View All Jobs</Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          6. RECRUITMENT PROCESS (India Gate BG)
      ═══════════════════════════════ */}
      <section id="recruitment" className={styles.recruitmentSection}>
        <div className={styles.recruitmentBg}>
          <Image
            src="/media/landing/india-gate.jpg"
            alt="India Gate — recruitment bridge from India to UAE"
            fill
            className={styles.recruitmentBgImg}
            sizes="100vw"
          />
          <div className={styles.recruitmentOverlay} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className={styles.eyebrowLight}>INDIA TO UAE RECRUITMENT</div>
          <h2 className={styles.sectionTitleLight}>
            We Make <span className="text-gradient-gold">Hiring Simple</span>
          </h2>
          <div className={styles.stepsGrid}>
            {RECRUITMENT_STEPS.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          7. BUSINESS SETUP
      ═══════════════════════════════ */}
      <section id="business-setup" className={styles.businessSection}>
        <div className="container">
          <div className={styles.businessLayout}>
            <div className={styles.businessLeft}>
              <div className={styles.eyebrow}>BUSINESS SETUP IN UAE</div>
              <h2 className={styles.businessHeadline}>
                Start Your Business<br />
                <span className="text-gradient-gold">The Smart Way</span>
              </h2>
              <p className={styles.businessDesc}>
                From company formation to PRO services — we guide you through every step.
              </p>
              <Button href="/business-setup" variant="primary" size="md">Explore Business Setup</Button>
              <Link href="/contact" className={styles.consultLink}>Get a Free Consultation</Link>
            </div>
            <div className={styles.businessCards}>
              {BUSINESS_SERVICES.map(({ Icon, title, desc, items }) => (
                <div key={title} className={styles.businessCard}>
                  <div className={styles.businessCardIcon}><Icon /></div>
                  <h3 className={styles.businessCardTitle}>{title}</h3>
                  <p className={styles.businessCardDesc}>{desc}</p>
                  <ul className={styles.businessCardList}>
                    {items.map((item) => (
                      <li key={item} className={styles.businessCardItem}>
                        <span className={styles.checkIcon}><IconCheck /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          8. BUILD YOUR UAE TEAM (Live Requisition Form)
      ═══════════════════════════════ */}
      <section id="manpower" className={styles.manpowerSection}>
        <div className={styles.manpowerBg}>
          <Image
            src="/media/landing/consultant.jpg"
            alt="Cityline corporate workforce advisory in Dubai"
            fill
            className={styles.manpowerBgImg}
            sizes="100vw"
          />
          <div className={styles.manpowerBgOverlay} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className={styles.manpowerLayout}>
            <div className={styles.manpowerLeft}>
              <div className={styles.eyebrowLight}>MANPOWER SOLUTIONS</div>
              <h2 className={styles.manpowerHeadline}>
                BUILD YOUR<br />
                <span className="text-gradient-gold">UAE TEAM</span>
              </h2>
              <p className={styles.manpowerDesc}>
                Tell us your requirements and we&apos;ll find the right people for your business.
              </p>
              <div className={styles.whyGrid}>
                {WHY_ITEMS.map(({ title, desc }) => (
                  <div key={title} className={styles.whyItem}>
                    <div className={styles.whyCheck}><IconCheck /></div>
                    <div>
                      <div className={styles.whyTitle}>{title}</div>
                      <div className={styles.whyDesc}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.manpowerRight}>
              <InlineManpowerForm />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          9. TESTIMONIALS — Real DB Data
      ═══════════════════════════════ */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className="container">
          <div className={styles.eyebrow}>WHY CHOOSE CITYLINE</div>
          <h2 className={styles.sectionTitle}>
            Trusted. Reliable. <span className="text-gradient-gold">Results Driven.</span>
          </h2>
          {/* Real testimonials from backend DB */}
          <TestimonialsSection />
        </div>
      </section>

      {/* ═══════════════════════════════
          10. FAQ
      ═══════════════════════════════ */}
      <section id="faq-preview" className={styles.faqSection}>
        <div className="container">
          <div className={styles.eyebrow}>FREQUENTLY ASKED QUESTIONS</div>
          <h2 className={styles.sectionTitle}>
            What do you <span className="text-gradient-gold">want to know?</span>
          </h2>
          <FAQAccordion items={previewFaqs} />
          <div className={styles.centeredCta}>
            <Button href="/faq" variant="glass" size="md">View All FAQs</Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
          11. FINAL CTA
      ═══════════════════════════════ */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTABg}>
          <Image
            src="/media/landing/hero-dubai.jpg"
            alt="Dubai skyline at golden hour"
            fill
            className={styles.finalCTAImg}
            sizes="100vw"
          />
          <div className={styles.finalCTAOverlay} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className={styles.eyebrowLight}>YOUR NEXT MOVE</div>
          <h2 className={styles.finalCTAHeadline}>
            STARTS <span className="text-gradient-gold">HERE.</span>
          </h2>
          <p className={styles.finalCTADesc}>
            All it takes is one conversation to change your life.
          </p>
          <div className={styles.finalCTAButtons}>
            <Button href="/visa-enquiry" variant="primary" size="lg">Start Your Journey</Button>
            <Button href="https://wa.me/971XXXXXXXXX" variant="glass" size="lg">Chat on WhatsApp</Button>
          </div>
        </div>
      </section>
    </>
  );
}
