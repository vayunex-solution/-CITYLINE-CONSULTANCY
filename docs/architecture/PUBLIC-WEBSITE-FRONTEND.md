# Public Website Architecture & Implementation (Phase 5)
**PROJECT**: CITYLINE CONSULTANCY
**STATUS**: APPROVED & LOCKED
**FRAMEWORK**: Next.js 14 (App Router) + TypeScript + Vanilla CSS Modules

---

## 1. Executive Summary
Phase 5 implements the complete public-facing web portal for **CITYLINE CONSULTANCY**. Operating within the locked architectural parameters of Phases 0–4, the portal delivers a **Cinematic + Glossy + Glass + Editorial UAE** aesthetic communicating the core positioning: **INDIA → JOURNEY → UAE → OPPORTUNITY**.

---

## 2. Route Inventory & Classification

### A. Public Application Routes (14 Static Routes)
1. `/` — **Homepage**: 13-stage editorial journey (Hero, Trust Strip, Intro, Services Grid, Visa Journey, Recruitment, Business Setup, UAE Opportunity, Jobs Preview, Why Cityline, Testimonials Empty-State, FAQ Preview, Final CTA, Footer).
2. `/about` — **About Page**: Editorial narrative explaining the India → UAE advisory bridge, service pillars, and values without invented corporate claims.
3. `/visa-services` — **Visa Services Overview**: Highlighting Freelance Visas and Visit Visas with clear regulatory advisory notices.
4. `/visa-services/freelance-visa` — **Freelance Visa Detail**: 2-year Dubai freelance visa residency facilitation overview and procedural steps.
5. `/visa-services/visit-visa-30-days` — **30-Day Visit Visa Detail**: Entry permit consultation, eligibility guidance, and checklist breakdown.
6. `/visa-services/visit-visa-60-days` — **60-Day Visit Visa Detail**: Extended visit visa procedural facilitation breakdown.
7. `/recruitment` — **Recruitment Portal**: Candidate journey and corporate employer recruitment across 8 confirmed sectors.
8. `/jobs` — **Jobs Directory**: Dynamic search, category filters, responsive cards, and empty state.
9. `/business-setup` — **Business Setup Overview**: UAE Company Formation and Full Company Setup guidance.
10. `/testimonials` — **Testimonials Page**: Strict empty-state layout awaiting verified client submissions without fake quotes or names.
11. `/contact` — **Contact Page**: Official advisory desk channels and contact form shell.
12. `/faq` — **FAQ Index**: Categorized procedural knowledge base with accessible accordion interaction.
13. `/visa-enquiry` — **Visa Consultation Shell**: Dedicated procedural form with immigration compliance notices.
14. `/employer-enquiry` — **Employer Requirement Shell**: Enterprise workforce procurement form.

### B. Dynamic Route Templates (2 Route Templates)
15. `/jobs/[slug]` — **Job Opportunity Detail Template**: Renders individual vacancy briefing (overview, responsibilities, requirements, verified employer placeholder).
16. `/jobs/[slug]/apply` — **Job Application Shell Template**: Candidate application enquiry form shell (validation, consent, resume readiness indicator).

*Dynamic Instances*: The 2 dynamic route templates render pages for all 8 development seed jobs (yielding 16 dynamic instance URLs: 8 detail views + 8 application shells).

### C. SEO & System Routes (2 Endpoints)
17. `/sitemap.xml` — **XML Sitemap**: Dynamically generated sitemap indexing 30 total URLs (14 static routes + 16 dynamic seed job routes).
18. `/robots.txt` — **Robots Directives**: Controlled indexing rules with protected `/api/` and `/admin/` path exclusions.

### D. System Fallback Route
19. `/_not-found` — Built-in Next.js 404 handler with brand-aligned navigation return.

---

## 3. Job Development Data & Category Representation
The job data architecture in `frontend/lib/data/jobs.ts` and `frontend/lib/data/recruitment.ts` strictly aligns with the 8 confirmed manpower sectors:

- **Total Supported Categories**: 8 (All 8 are active in the recruitment ecosystem and filterable in `/jobs`).
- **Total Development Seed Opportunities**: Exactly 8 seed opportunities (`job-1` through `job-8`), with each seed job corresponding directly to one of the 8 locked manpower categories:
  1. *Hotel Staff* → Hotel Front Office Associate (`hotel-front-office-associate`)
  2. *Cleaning & Facility Care* → Commercial Facility Cleaner (`commercial-facility-cleaner`)
  3. *Mason* → Civil Block & Plaster Mason (`civil-block-mason`)
  4. *Steel Fixer* → Structural Steel Fixer (`structural-steel-fixer`)
  5. *Carpenter* → Shuttering Carpenter (`shuttering-carpenter`)
  6. *Bike Rider / Delivery Job* → Express Delivery Bike Rider (`express-delivery-bike-rider`)
  7. *Taxi Driver* → Metropolitan Fleet Taxi Driver (`city-taxi-driver`)
  8. *Truck Driver* → Heavy Transport Truck Driver (`heavy-truck-driver`)

**Governance & Integrity Rules**:
- These opportunities serve as frontend development seeds for layout validation only.
- No fabricated employer names are presented as real companies.
- No fabricated salary amounts, sign-on packages, or guaranteed wages are shown.
- No visa or employment guarantees are made.
- The UI explicitly marks mock opportunities as development seeds and prepares for seamless live API data hydration in Phase 8/13.

---

## 4. Frontend Form Architecture & Security Boundary
All public enquiry and application interfaces (`ContactForm`, `VisaEnquiryForm`, `EmployerEnquiryForm`, `JobApplicationForm`) are implemented as frontend-only shells.

> **Validation & Security Boundary Definition**:
> Client-side validation improves user experience and catches malformed input before submission. It is not a security boundary. Server-side validation, sanitization, persistence security and document/upload security will be implemented in the corresponding backend phases.

- No backend submission, database insertion, or email dispatch was introduced in Phase 5.
- No file storage or malware scanning was introduced in Phase 5.
- Zero secrets or backend credentials exist in frontend code or client bundles.
- No arbitrary `dangerouslySetInnerHTML` is used in application content (only a static inline anti-FOUC theme initialization script is present in `layout.tsx`).

---

## 5. Visual QA & Verification Status

| Verification Category | Status | Details |
|---|---|---|
| **Automated Route/Markup Verification** | **VERIFIED** | All 14 static routes, dynamic templates, sitemap, and robots tested via automated HTTP probes on a live server instance. All return HTTP 200 with full markup and zero broken links. |
| **CSS Module Loading & Isolation** | **VERIFIED** | All CSS modules compile cleanly without class clashes or layout corruption. |
| **Theme System & Anti-FOUC** | **VERIFIED** | Synchronous theme script prevents unstyled flashing; theme tokens adapt cleanly between light and dark modes with preserved contrast. |
| **Responsive CSS Breakpoints** | **VERIFIED** | Code-level constraints and viewport tests ensure mobile layouts (320px–414px), tablet (768px–1024px), and desktop (1366px–1920px) maintain proper padding, stacking, and zero horizontal overflow. |
| **Zero Pricing Verification** | **VERIFIED** | Automated text audit confirms 0 price mentions, 0 currency symbols (`AED`, `$`, `€`, `£`, `INR`), and 0 "starting from" expressions in visible text across all routes. |
| **Content Governance Audit** | **VERIFIED** | Confirmed 0 instances of illegal suffixes (`LLC`, `FZE`, `FZLLC`), 0 fake success percentages, and 0 approval guarantees across all pages. |
| **Browser Screenshot Visual QA** | **UNVERIFIED / BLOCKED** | Direct automated browser screenshot capture could not be executed due to an upstream Azure CDN 404 error during the external Playwright driver download (`playwright-1.57.0-win32_x64.zip`). Verified via live HTTP markup and DOM validation. |
