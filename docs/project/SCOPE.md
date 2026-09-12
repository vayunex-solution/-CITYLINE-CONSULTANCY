# CITYLINE CONSULTANCY — Scope & Boundary Definition

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Classification Standard**: Every item classified as [CONFIRMED], [PROPOSED], [OPEN QUESTION], [CONSTRAINT], or [RISK].

---

## 1. Scope Overview

This document delineates the strict functional and technical boundaries for the **CITYLINE CONSULTANCY** web platform. Features not explicitly designated under **In-Scope** are prohibited from implementation during the initial production delivery cycle.

---

## 2. In-Scope for Current Project

### 2.1. Public-Facing Web Platform
1. **Design System & Theme Engine**:
   - Dynamic Light / Dark mode toggle with persisted user preference. `[CONFIRMED]`
   - Modern UAE-aligned executive styling utilizing glassmorphism, depth layers, and backdrop blur. `[CONFIRMED]`
   - Cinematic hero component with AI-generated high-definition video background. `[CONFIRMED]`
   - Micro-animations, responsive layout transitions, and mobile-first touch optimization. `[CONFIRMED]`
2. **Major Public Information Pages**:
   - **Home**: Executive hero, vertical introduction, featured job carousel, testimonials, conversion prompts. `[CONFIRMED]`
   - **About Us**: Mission, values, consultative philosophy, UAE market positioning. `[CONFIRMED]`
   - **Visa Services (Hub)**: Comprehensive overview of freelance and visit visa services. `[CONFIRMED]`
   - **Freelance Visa**: Deep dive into 2-Year Freelance Visa assistance. `[CONFIRMED]`
   - **Visit Visa**: Dedicated presentation for 30-Day and 60-Day Visit Visa assistance. `[CONFIRMED]`
   - **Recruitment / Manpower (Hub)**: Corporate workforce supply capabilities across trade/service sectors. `[CONFIRMED]`
   - **Jobs / Opportunities (Board)**: Searchable, filterable listing of open opportunities. `[CONFIRMED]`
   - **Job Detail**: Deep dive page per listing containing role description, category, and apply action. `[CONFIRMED]`
   - **Business Setup**: Advisory overview strictly covering confirmed services: UAE Company Formation and UAE Company Setup / advisory. Consultative only; no arbitrary pricing or unconfirmed packages. `[CONFIRMED]`
   - **Testimonials**: Dedicated curation of client and candidate feedback. `[CONFIRMED]`
   - **Contact Us**: Contact details, map/location info, general inquiry form. `[CONFIRMED]`
   - **FAQ**: Grouped collapsible questions addressing visa procedures, company setup, and job application policies. `[CONFIRMED]`
3. **SEO Foundation & Architecture (Phase 5 Responsibility)**:
   - *Phase 5 Mandate*: Establish core semantic HTML structure, proper heading hierarchy (single `<h1>` per page, sequential `<h2>`/`<h3>`), metadata architecture (dynamic title tags, meta descriptions), canonical URL tags, Open Graph (OG) and Twitter card tags, XML sitemap architecture, `robots.txt` configuration, schema.org JSON-LD structured data architecture, clean URL slugs, and accessibility-friendly DOM landmarks. `[CONFIRMED]`
   - *Phase 16 Mandate*: Post-implementation performance profiling, Core Web Vitals optimization, asset compression, browser caching headers, search engine crawler verification, and Lighthouse audit validation. `[CONFIRMED]`
4. **Interactive Conversion Flows**:
   - **Visa Enquiry Submission Flow**: Multi-field form with dynamic file attachment support. `[CONFIRMED]`
   - **Job Application Submission Flow**: CV/Resume upload attached to specific job records. `[CONFIRMED]`
   - **Employer Manpower Requisition Flow**: Business workforce request intake. `[CONFIRMED]`
   - **General Contact Message Flow**: Standard inquiry intake. `[CONFIRMED]`

### 2.2. Document Security & Storage Subsystem
1. **Private Hosting-Based Storage**:
   - Utilization of the available 100 GB hosting allocation on cPanel. `[CONSTRAINT]`
   - Physical placement of uploaded assets **outside** the public HTTP document root (`public_html`). `[CONFIRMED]`
   - Strict prevention of direct URL-based asset execution or retrieval. `[CONFIRMED]`
2. **File Processing Pipeline**:
   - Cryptographic file renaming (UUIDv4) and timestamp prefixing to prevent enumeration. `[CONFIRMED]`
   - Rigorous MIME-type and magic-byte header validation. `[CONFIRMED]`
   - Hard execution prevention (.php, .sh, .exe, .js file rejection). `[CONFIRMED]`
   - Authorized streaming proxy API ensuring only authenticated administrators can retrieve applicant files. `[CONFIRMED]`

### 2.3. Communications & Notifications
1. **Resilient SMTP Notification Engine**:
   - SMTP integration dispatching notification emails upon new submissions. `[CONFIRMED]`
   - **Decoupled Persistence Guarantee**: Form submission persistence must never depend on SMTP delivery success. Database writes occur first; email dispatches are queued or isolated with fail-safe logging. `[CONFIRMED]`

### 2.4. Protected Administrative Platform
1. **Core Admin Governance**:
   - Secure credential-based authentication with bcrypt/Argon2id password hashing and session management. `[CONFIRMED]`
   - Protected route guards and session invalidation. `[CONFIRMED]`
2. **Administrative Modules**:
   - **Dashboard**: High-level metrics (total submissions, pending visa enquiries, recent job applications, active jobs). `[PROPOSED]`
   - **Visa Enquiry Manager**: Inspect enquiries, review applicant details, download uploaded documents securely. `[CONFIRMED]`
   - **Job Board Management**: Full CRUD for job postings (create, edit, toggle active/inactive status, archive/delete). `[CONFIRMED]`
   - **Job Category Management**: Dynamic creation and editing of job categories (extensible beyond initial 8). `[CONFIRMED]`
   - **Application Manager**: Review applicant profiles, download CVs, change application triage status. `[CONFIRMED]`
   - **Employer Manpower Manager**: Review corporate workforce inquiries and status tracking. `[CONFIRMED]`
   - **Testimonial Manager**: Add, edit, publish/unpublish, and archive client testimonials. `[CONFIRMED]`
   - **Visitor Analytics Viewer**: Privacy-preserving dashboard showing page hits, referrers, device distribution, and conversion rates. `[CONFIRMED]`
   - **Audit Logs**: Administrative trail of critical changes and file downloads. `[PROPOSED]`

---

## 3. Out of Scope / Deferred Add-ons

The following items are strictly **OUT OF SCOPE** for the current delivery cycle. Any introduction of these features requires formal change orders:

| Feature / System | Classification | Rationale for Exclusion |
| :--- | :--- | :--- |
| **WhatsApp Automation & Chatbots** | `OUT OF SCOPE` | Requires third-party BSP (Twilio/Meta) licensing, webhook management, and conversational state machine. |
| **Payment Gateway Integration** | `OUT OF SCOPE` | Service pricing is strictly non-public; all commercial transactions are managed consultative off-platform. |
| **Candidate Self-Service Accounts** | `OUT OF SCOPE` | Unnecessary overhead for initial talent collection; applications are direct stateless submissions. |
| **Employer Self-Service Portal** | `OUT OF SCOPE` | Employer interactions are consultative B2B relationships managed by internal consultancy staff. |
| **Third-Party CRM Integrations** | `OUT OF SCOPE` | Proprietary admin panel serves as primary record repository; API webhooks can be scoped in future phases. |
| **Arabic Language Localization** | `OUT OF SCOPE` | Content and operational focus is initially English-first. Multi-lingual architecture deferred. |
| **Full ATS Hiring Pipelines** | `OUT OF SCOPE` | Automated interview booking, multi-party evaluations, and video screenings belong to dedicated SaaS tools. |
| **Automated Email Marketing Engine** | `OUT OF SCOPE` | Bulk newsletters and automated marketing campaigns present spam/reputation risks on cPanel shared IP pools. |
| **AI Conversational Assistants** | `OUT OF SCOPE` | Direct lead capture forms provide higher data integrity than generative chat for regulatory visa inquiries. |

---

## 4. Scope Governance & Change Management

```
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ Stakeholder Change Req │ ───► │ Impact Analysis (CTO)   │ ───► │ Formal Scope Amendment │
│ (Feature / Modification│       │ (Cost, Tech, Schedule) │       │ (Signed Approval Req)  │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

1. **Change Freeze**: Following Phase 0 sign-off, all functional scope items are frozen.
2. **Deviation Protocol**: If unexpected regulatory mandates from UAE authorities emerge (e.g., mandatory biometric or security fields for visit visas), an immediate technical evaluation is conducted, logged in `OPEN-QUESTIONS.md`, and formally approved before code modification.

---

## 5. Content Governance & Strict Prohibitions

In subsequent implementation phases (Phases 1 through 19), developers and content authors are strictly forbidden from creating or publishing:
1. **Unconfirmed Pricing**: No visa fees, processing rates, typing charges, or business setup package prices.
2. **Unconfirmed Document Checklists**: No mandatory document requirements unless confirmed via `OQ-BIZ-01`.
3. **Fabricated Approvals & Timelines**: No "100% approval guarantees", "guaranteed 24-hour turnaround", or similar false promises.
4. **Government Misrepresentation**: No claims implying Cityline Consultancy is a government entity, visa issuing agency, or official sponsor.
5. **Synthetic Testimonials / Reviews**: No fabricated reviews or placeholder testimonials.
