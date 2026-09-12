# CITYLINE CONSULTANCY — User Journeys & Experience Architecture

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Classification Standard**: Every item classified as [CONFIRMED], [PROPOSED], [OPEN QUESTION], [CONSTRAINT], or [RISK].

---

## 1. Journey Architecture Overview

The **CITYLINE CONSULTANCY** platform supports four external conversion journeys and one internal operational governance journey. Each journey is designed to maximize conversion, eliminate data entry friction, ensure legal integrity, and maintain data confidentiality.

---

## 2. Persona Journeys

### 2.1. Journey 1: Visa Seeker (PER-01) — Residency & Tourist Visa Assistance

```
[Discovery / Organic Traffic]
             │
             ▼
[Visa Services Hub / Dedicated Page]
  - 2-Year Freelance Visa
  - 30-Day Visit Visa
  - 60-Day Visit Visa
             │
             ▼
[Review Requirements & Scope] ◄── No public pricing displayed [CONFIRMED]
             │
             ▼
[Initiate Visa Enquiry Flow] (Configurable Stepper / Modal) [PROPOSED]
  ├── Step 1: Applicant Identity & Contact (Name, Email, WhatsApp/Phone, Nationality)
  ├── Step 2: Visa Category Selection (Freelance vs 30-Day vs 60-Day)
  └── Step 3: Secure Document Upload (Passport Copy, Photo, Current Status) [OPEN QUESTION]
             │
             ▼
[Client-Side Validation & MIME/Size Check]
             │
             ▼
[Submission to API Server]
  ├── Phase A: Database Record Persisted (Atomic Transaction)
  ├── Phase B: Pending Notification Job Created in `notification_queue`
  ├── Phase C: Files Saved to Private Storage (~/clc_storage/documents/)
  └── Phase D: Decoupled Cron Dispatcher Executes SMTP Alert
             │
             ▼
[Success Confirmation & Reference Code Displayed]
```

- **Touchpoints**: Header navigation, Visa Services Hub (`/visa-services`), Dedicated landing routes (`/visa-services/freelance-visa`, `/visa-services/visit-visa`), Global CTA buttons.
- **Conversion Objective**: Lead capture with valid contact details and verified file attachments.
- **Security Boundary**: Uploaded documents immediately transit into restricted, non-public storage.

---

### 2.2. Journey 2: Job Seeker (PER-02) — UAE Employment Application

```
[Entry via Jobs Board / Search Engine] (`/jobs`)
             │
             ▼
[Browse & Filter Open Opportunities]
  ├── Category Filter (Hotel Staff, Cleaning, Mason, Steel Fixer, Carpenter, Bike Rider, Taxi, Truck Driver)
  └── Search Query (Keyword search across title and description)
             │
             ▼
[Inspect Job Detail Page] (`/jobs/:slug`)
  ├── Role Specifications & Requirements
  ├── Category & Location Information
  └── "Apply Now" Action Trigger
             │
             ▼
[Job Application Submission Flow]
  ├── Candidate Name, Contact Phone/WhatsApp, Email, Current UAE Location/Status
  └── Resume / CV Upload (PDF, DOCX — Max 5MB, Zip-Bomb Protected)
             │
             ▼
[API Submission & Atomic Database Entry]
  ├── Database Record Committed
  ├── Pending Job in `notification_queue`
  └── Resume Written to ~/clc_storage/resumes/
             │
             ▼
[Decoupled Cron Worker Dispatches HR Email]
             │
             ▼
[Instant Confirmation Screen with Application Reference]
```

- **Touchpoints**: Top navigation (`/jobs`), Homepage featured positions, Job detail route (`/jobs/:slug`).
- **Conversion Objective**: Complete application submission with validated curriculum vitae.
- **Performance Requirement**: Instant client-side filtering without page reloads.

---

### 2.3. Journey 3: UAE Employer (PER-03) — Corporate Manpower Requisition

```
[Entry via Recruitment Hub] (`/recruitment`)
             │
             ▼
[Explore Manpower Capabilities & Workforce Categories]
  - Hospitality, Facilities, Civil Construction, Joinery, Last-Mile Logistics, Transport
             │
             ▼
[Trigger "Request Workforce" Action]
             │
             ▼
[Employer Manpower Requisition Form]
  ├── Company Details (Name, Industry, Contact Person) [PROPOSED]
  ├── Contact Credentials (Corporate Email, Phone / WhatsApp) [PROPOSED]
  ├── Manpower Requirements (Required Category, Worker Headcount, Deployment Location) [PROPOSED]
  └── Special Instructions / Notes
             │
             ▼
[Database Persistence ──► Notification Queue ──► Cron Dispatches SMTP Admin Alert]
             │
             ▼
[Acknowledgment Screen Indicating B2B Consultant Follow-Up]
```

- **Touchpoints**: Top navigation (`/recruitment`), Homepage B2B section, Dedicated contact CTA.
- **Conversion Objective**: High-value enterprise lead generation for bulk staffing contracts.
- **Open Questions**: Whether Trade License attachment or TRN is required at initial intake.

---

### 2.4. Journey 4: Business Client / Entrepreneur (PER-04) — UAE Company Formation

```
[Entry via Business Setup Hub] (`/business-setup`)
             │
             ▼
[Review Corporate Structuring Advisory Capabilities]
  - Mainland, Free Zone, and Offshore Guidance
  - Administrative & Setup Coordination
  - Strictly Consultative: Zero fabricated package rates or fake licensing timelines
             │
             ▼
[Initiate Setup Consultation Request]
  ├── Entrepreneur / Corporate Name, Email, Phone/WhatsApp
  ├── Target Business Activity & Entity Type Preference
  └── Consultation Schedule Request / Operational Details
             │
             ▼
[Database Persistence ──► Notification Queue ──► Cron Dispatches Advisory Lead Alert]
             │
             ▼
[Confirmation Notification with Advisory Lead Reference]
```

- **Touchpoints**: Top navigation (`/business-setup`), Global Footer, Contact page dropdown.
- **Conversion Objective**: Direct consultative consultation capture.

---

### 2.5. Journey 5: Platform Administrator (PER-05) — Secure Platform Management

```
[Admin Authentication Page] (`/admin/login`)
             │
             ▼
[Credential Entry + IP Throttling + Progressive Exponential Delay Guard]
             │
             ▼
[Admin Dashboard (RBAC Enforced: Super Admin vs Admin Operator)]
  ├── System Overview (New Enquiries, Total Applications, Active Jobs, Storage Quota Meter)
  ├── Navigation Menu (Enquiries, Jobs, Applications, Testimonials, Analytics, Settings)
  │
  ├───► [Visa Enquiries Module]
  │       ├── Filter by Date / Visa Type / Status
  │       ├── View Detailed Lead Information
  │       ├── Secure Download Link (Calls Authenticated API Stream /api/admin/docs/:id)
  │       └── Authorized Purge Action (Super Admin only: unlinks file & updates retention status)
  │
  ├───► [Job Board Module]
  │       ├── Create New Job (Title, Description, Dynamic Category Dropdown, Status)
  │       ├── Edit / Unpublish / Archive Existing Roles
  │       └── Create New Category on Demand
  │
  ├───► [Applications Module]
  │       ├── Inspect Candidate Details per Job
  │       ├── Download Candidate CV via Secure Stream
  │       └── Update Status (New, Reviewed, Contacted, Archived)
  │
  ├───► [Testimonials Module]
  │       ├── Create Testimonial (Client Name, Content, Role, Image Upload)
  │       └── Toggle Active State / Order Priority
  │
  ├───► [Append-Oriented Audit Log Module]
  │       └── Review Log of Logins, Document Downloads, Purges, and Status Changes
  │
  └───► [Privacy-Preserving Visitor Analytics]
          └── Inspect Traffic Trends, Top Pages, Device Breakdown, Form Funnels (Pseudonymous Data)
```

- **Security Constraint**: No document is directly accessible via public URL. Admin must hold an active, verified, HTTP-only session cookie with appropriate RBAC privileges to trigger streaming downloads or purges.
