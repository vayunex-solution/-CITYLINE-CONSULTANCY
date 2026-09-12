/**
 * CITYLINE CONSULTANCY — Reference Data Seed
 * Seeds strictly verified system reference data (Admin Roles, Job Categories, Visa Services).
 *
 * GOVERNANCE:
 * - NO fake customers, job applications, testimonials, or mock pricing.
 * - Deterministic, idempotent execution using upserts.
 */

import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
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
      title: '2-Year Freelance Visa Dubai Assistance',
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
}
