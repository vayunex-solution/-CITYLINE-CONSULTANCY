"use strict";
/**
 * CITYLINE CONSULTANCY — Reference Data Seed
 * Seeds strictly verified system reference data (Admin Roles, Job Categories, Visa Services).
 *
 * GOVERNANCE:
 * - NO fake customers, job applications, testimonials, or mock pricing.
 * - Deterministic, idempotent execution using upserts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
async function seed(knex) {
    // 1. Seed Verified Administrative Roles (RBAC)
    const roles = [
        {
            id: 1,
            role_key: 'super_admin',
            name: 'Super Administrator',
            description: 'Complete system governance, security policies, purge authority, and admin management.',
        },
        {
            id: 2,
            role_key: 'admin_operator',
            name: 'Administrative Operator',
            description: 'Operational lead triage, candidate review, job vacancy editing, and document viewing.',
        },
    ];
    for (const role of roles) {
        const existing = await knex('admin_roles').where({ role_key: role.role_key }).first();
        if (!existing) {
            await knex('admin_roles').insert(role);
        }
    }
    // 2. Seed Confirmed Job Categories (Phase 0 Confirmed Scope)
    const categories = [
        { id: 1, name: 'Hotel Staff', slug: 'hotel-staff', display_order: 1 },
        { id: 2, name: 'Cleaning', slug: 'cleaning', display_order: 2 },
        { id: 3, name: 'Mason', slug: 'mason', display_order: 3 },
        { id: 4, name: 'Steel Fixer', slug: 'steel-fixer', display_order: 4 },
        { id: 5, name: 'Carpenter', slug: 'carpenter', display_order: 5 },
        { id: 6, name: 'Bike Rider / Delivery Job', slug: 'bike-rider-delivery', display_order: 6 },
        { id: 7, name: 'Taxi Driver', slug: 'taxi-driver', display_order: 7 },
        { id: 8, name: 'Truck Driver', slug: 'truck-driver', display_order: 8 },
    ];
    for (const cat of categories) {
        const existing = await knex('job_categories').where({ slug: cat.slug }).first();
        if (!existing) {
            await knex('job_categories').insert(cat);
        }
    }
    // 3. Seed Confirmed Visa Services (Phase 0 Confirmed Scope — Zero Pricing)
    const visaServices = [
        {
            id: 1,
            service_code: 'freelance_2yr',
            title: '2-Year Freelance Visa Dubai',
            slug: '2-year-freelance-visa',
            description: 'Comprehensive assistance for the 2-Year UAE Freelance Residency Visa.',
            display_order: 1,
        },
        {
            id: 2,
            service_code: 'visit_30d',
            title: '30-Day Visit Visa',
            slug: '30-day-visit-visa',
            description: 'Short-term UAE single entry tourist and visit visa assistance.',
            display_order: 2,
        },
        {
            id: 3,
            service_code: 'visit_60d',
            title: '60-Day Visit Visa',
            slug: '60-day-visit-visa',
            description: 'Extended UAE tourist and visit visa assistance.',
            display_order: 3,
        },
    ];
    for (const service of visaServices) {
        const existing = await knex('visa_services').where({ service_code: service.service_code }).first();
        if (!existing) {
            await knex('visa_services').insert(service);
        }
    }
    // 4. Seed Confirmed Sample Development Job Vacancies (Phase 8 Development Data)
    // Transparently identified as sample opportunities across the 8 locked categories.
    // Zero fake employer names, zero fake salaries, zero guaranteed visa/placement claims.
    const sampleJobs = [
        {
            id: '018f0000-0000-7000-8000-000000000001',
            category_id: 1, // Hotel Staff
            title: 'Hotel Front Office Associate',
            slug: 'hotel-front-office-associate',
            location: 'Dubai, UAE',
            employment_type: 'Full-time',
            description: 'Support guest reception, registration, and concierge coordination in a licensed Dubai hospitality facility. Coordinates guest check-ins, front-desk correspondence, and inter-departmental inquiries.',
            requirements: 'Prior experience in hospitality customer service or front-desk operations. Strong conversational English. Professional grooming and verified passport.',
            responsibilities: 'Manage guest arrivals and departures. Answer visitor inquiries regarding services and transport. Coordinate room status with housekeeping.',
            qualification: 'Secondary School Certificate / Diploma in Hospitality preferred.',
            experience_years_required: 1,
            status: 'active',
            is_featured: true,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000002',
            category_id: 2, // Cleaning
            title: 'Commercial Facility Cleaner',
            slug: 'commercial-facility-cleaner',
            location: 'Abu Dhabi, UAE',
            employment_type: 'Full-time',
            description: 'Perform routine sanitization, waste handling, and facility upkeep for corporate and commercial premises in Abu Dhabi.',
            requirements: 'Physical fitness for active facility maintenance duties. Basic English or Hindi communication. Prior commercial cleaning experience is advantageous but not mandatory.',
            responsibilities: 'Sanitize designated commercial zones, restrooms, and common areas. Safely utilize standard cleaning equipment and agents. Report maintenance issues.',
            qualification: 'Basic Education / Secondary Certificate.',
            experience_years_required: 0,
            status: 'active',
            is_featured: true,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000003',
            category_id: 3, // Mason
            title: 'Civil Block & Plaster Mason',
            slug: 'civil-block-plaster-mason',
            location: 'Dubai, UAE',
            employment_type: 'Full-time',
            description: 'Civil construction mason required for block work, surface leveling, and interior/exterior plastering on commercial residential projects.',
            requirements: 'Demonstrated trade experience in block laying and plaster finishing. Ability to follow site supervisor instructions and adhere to site safety regulations.',
            responsibilities: 'Erect structural brick and block walls to plumb-line tolerances. Prepare and apply mortar and cement plaster. Maintain clean work area.',
            qualification: 'Vocational Trade Certificate or verified practical site experience.',
            experience_years_required: 2,
            status: 'active',
            is_featured: true,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000004',
            category_id: 4, // Steel Fixer
            title: 'Reinforced Concrete Steel Fixer',
            slug: 'reinforced-concrete-steel-fixer',
            location: 'Sharjah, UAE',
            employment_type: 'Full-time',
            description: 'Positions and secures reinforcement steel bars and mesh according to structural engineering drawings for civil concrete foundations and slabs.',
            requirements: 'Practical experience in steel rebar cutting, bending, and tying. Strict adherence to occupational health and personal protective equipment standards.',
            responsibilities: 'Read bar bending schedules. Position rebar reinforcement for foundations, beams, and columns. Secure cages using tie wires and spacers.',
            qualification: 'Trade Apprenticeship or verified construction experience.',
            experience_years_required: 2,
            status: 'active',
            is_featured: false,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000005',
            category_id: 5, // Carpenter
            title: 'Shuttering & Formwork Carpenter',
            slug: 'shuttering-formwork-carpenter',
            location: 'Dubai, UAE',
            employment_type: 'Full-time',
            description: 'Erects and dismantles wooden, plywood, and modular formwork shuttering for concrete pouring operations across commercial project sites.',
            requirements: 'Hands-on experience in timber shuttering and structural formwork. Ability to align formwork true to level and elevation specifications.',
            responsibilities: 'Fabricate and assemble timber formwork for columns, beams, and slabs. Ensure leak-proof joints before concrete pouring. Strip formwork safely.',
            qualification: 'Vocational Trade Certificate or verified on-site experience.',
            experience_years_required: 2,
            status: 'active',
            is_featured: false,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000006',
            category_id: 6, // Bike Rider / Delivery Job
            title: 'Urban Delivery Courier Rider',
            slug: 'urban-delivery-courier-rider',
            location: 'Dubai, UAE',
            employment_type: 'Full-time',
            description: 'Execute prompt, safety-compliant package and document dispatch across metropolitan Dubai zones utilizing company-assigned motorcycles.',
            requirements: 'Valid motorcycle driving license. Knowledge of Dubai street grids and GPS navigation. Professional on-road conduct and customer courtesy.',
            responsibilities: 'Transport consignments safely to destination addresses. Confirm electronic proof of delivery on handheld terminals. Adhere strictly to traffic safety codes.',
            qualification: 'Valid Motorcycle Driving License.',
            experience_years_required: 1,
            status: 'active',
            is_featured: true,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000007',
            category_id: 7, // Taxi Driver
            title: 'Fleet Passenger Taxi Driver',
            slug: 'fleet-passenger-taxi-driver',
            location: 'Dubai, UAE',
            employment_type: 'Full-time',
            description: 'Operate licensed passenger transport vehicles providing safe, courteous, and route-efficient urban transit services across Dubai.',
            requirements: 'Valid light vehicle driving license with clean record. Basic English communication skills. Courteous demeanor and commitment to passenger comfort.',
            responsibilities: 'Transport passengers safely via optimal routes. Operate taximeter and point-of-sale card payment terminals. Maintain vehicle cleanliness.',
            qualification: 'Valid Light Vehicle Driving License.',
            experience_years_required: 2,
            status: 'active',
            is_featured: false,
            published_at: knex.fn.now(),
        },
        {
            id: '018f0000-0000-7000-8000-000000000008',
            category_id: 8, // Truck Driver
            title: 'Heavy Commercial Truck Driver',
            slug: 'heavy-commercial-truck-driver',
            location: 'Ras Al Khaimah, UAE',
            employment_type: 'Full-time',
            description: 'Operate heavy transport vehicles hauling building materials and industrial freight between distribution hubs and construction centers.',
            requirements: 'Valid UAE Heavy Vehicle Driving License (or equivalent transferable international credential). Demonstrated understanding of load securing and road safety protocols.',
            responsibilities: 'Safely operate heavy haulage vehicles on inter-emirate highway networks. Perform pre-trip vehicle mechanical inspections. Supervise cargo securing.',
            qualification: 'Valid Heavy Truck Driving License.',
            experience_years_required: 3,
            status: 'active',
            is_featured: false,
            published_at: knex.fn.now(),
        },
    ];
    for (const job of sampleJobs) {
        const existing = await knex('jobs').where({ slug: job.slug }).first();
        if (!existing) {
            await knex('jobs').insert(job);
        }
    }
}
